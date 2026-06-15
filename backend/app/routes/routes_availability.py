from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime
import pandas as pd
import os
import numpy as np
from backend.app.services.availability_service import fetch_bike_availability, fetch_scooter_availability, fetch_bike_history_segments, fetch_scooter_history_segments

router = APIRouter(tags=["Availability"])

# gbfs URL für die Bikestationen
MA_NEXTBIKE_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/nextbike_vn/station_status"
KA_NEXTBIKE_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/nextbike_fg/station_status"
STU_REGIORAD_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/regiorad_stuttgart/station_status"

# gbfs URL für die E-Scooter
FREEBIKESTATUS_URL = {
    "stuttgart": [
        {"provider": "voi", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/voi_de/free_bike_status"},
        {"provider": "lime", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/lime_bw/free_bike_status"},
        {"provider": "bolt", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/bolt_stuttgart/free_bike_status"},
        {"provider": "dott", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/dott_stuttgart/free_bike_status"}
    ],
    "karlsruhe": [
        {"provider": "voi", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/voi_de/free_bike_status"},
        {"provider": "bolt", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/bolt_karlsruhe/free_bike_status"},
        {"provider": "dott", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/dott_karlsruhe/free_bike_status"}
    ],
    "mannheim": [
        {"provider": "voi", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/voi_de/free_bike_status"},
        {"provider": "dott", "url": "https://api.mobidata-bw.de/sharing/gbfs/v2/dott_mannheim/free_bike_status"}
    ]
}

# Datenpfade
STATION_DATA_DIR = "backend/data/stations/"
AVAILABILITY_DATA_DIR = "backend/data/availability/bike"
SCOOTER_AVAILABILTY_DATA_DIR = "backend/data/availability/scooter"

# Uni Locations
UNI = {
    "stuttgart": {
        "uni": {
            "lat": 48.7817,
            "lon": 9.1752
        },
        "uniHohenheim": {
            "lat": 48.7125,
            "lon": 9.214
        },
        "dhbw": {
            "lat": 48.7823,
            "lon": 9.17622
        }
    },

    "karlsruhe": {
        "kit": {
            "lat": 49.00947,
            "lon": 8.41167
        },
        "hochschule": {
            "lat": 49.015556,
            "lon": 8.390833
        },
        "paedagogischeHochschule": {
            "lat": 49.013749,
            "lon": 8.392738
        }
    },

    "mannheim": {
        "uni": {
            "lat": 49.483196,
            "lon": 8.464687
        },
        "hochschule": {
            "lat": 49.469557,
            "lon": 8.482207
        },
        "dhbw": {
            "lat": 49.474444,
            "lon": 8.534722
        }
    },
}

@router.get("/availability/current/{city}/{uni}")
async def get_current_availability(city: str, uni: str):

    city_key = city.lower()

    # Je nach gewünschte Stadt und Uni laden
    if city_key == "stuttgart":
        bike_gbfs_url = STU_REGIORAD_STATIONSTATUS_URL
        file_name = "STU_regiorad_stationinfo.csv"
        unis = UNI["stuttgart"]
        scooter_gbfs_urls = FREEBIKESTATUS_URL["stuttgart"]
    elif city_key == "mannheim":
        bike_gbfs_url = MA_NEXTBIKE_STATIONSTATUS_URL
        file_name = "MA_nextbike_stationinfo.csv"
        unis = UNI["mannheim"]
        scooter_gbfs_urls = FREEBIKESTATUS_URL["mannheim"]
    elif city_key == "karlsruhe":
        bike_gbfs_url = KA_NEXTBIKE_STATIONSTATUS_URL
        file_name = "KA_nextbike_stationinfo.csv"
        unis = UNI["karlsruhe"]
        scooter_gbfs_urls = FREEBIKESTATUS_URL["karlsruhe"]
    else:
        raise HTTPException(status_code=404, detail="City not found")

    if uni not in unis:
        raise HTTPException(status_code=404, detail=f"Uni not found")

    uni_lat = unis[uni]["lat"]
    uni_lon = unis[uni]["lon"]

    # Daten für Fahrrad und E-Scooter holen
    bike_data = fetch_bike_availability(bike_gbfs_url, file_name)
    scooter_data = fetch_scooter_availability(scooter_gbfs_urls, uni_lat, uni_lon)

    return {
        "bike": bike_data,
        "e-scooter": scooter_data
    }
    

@router.get("/availability/history/{city}")
async def get_history_availability(city: str):

    city = city.lower()

    if city == "stuttgart":
        file_name = "STU_kw21_stationinfo.csv"
    elif city == "mannheim":
        file_name = "MA_kw21_stationinfo.csv"
    elif city == "karlsruhe":
        file_name = "KA_kw21_stationinfo.csv"
    else:
        raise HTTPException(status_code=404, detail="City not found")
    
    file_path = os.path.join(AVAILABILITY_DATA_DIR, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Daten not found")
        
    df = pd.read_csv(file_path)

    df['last_reported_clean'] = df['last_reported'].str.slice(0, 19)
    df['last_reported_clean'] = pd.to_datetime(df['last_reported_clean'])
    df['stunde'] = df['last_reported_clean'].dt.hour
    
    # Mittelwert für jede Stunde pro Station
    df_hourly = df.groupby(['station_id', 'stunde'])['num_bicycles_available'].mean().reset_index()
    df_hourly['num_bicycles_available'] = df_hourly['num_bicycles_available'].round(2)

    history_by_station = []

    for station_id, group in df_hourly.groupby('station_id'):
        # 'group' enthält genau die 24 Zeile (aka Stunden) dieser einen Station
        x_data = group['stunde'].tolist()
        y_data = group['num_bicycles_available'].tolist()
        
        history_by_station.append({
            "station_id": str(station_id),
            "x_data": x_data,
            "y_data": y_data
        })
    
    return history_by_station

@router.get("/availability/history/segments/{city}")
async def get_history_availability_segments(city: str):

    city_key = city.lower()

    if city_key == "stuttgart":
        bike_file_name = "STU_kw21_stationinfo.csv"
    elif city_key == "mannheim":
        bike_file_name = "MA_kw21_stationinfo.csv"
    elif city_key == "karlsruhe":
        bike_file_name = "KA_kw21_stationinfo.csv"
    else:
        raise HTTPException(
            status_code=404, 
            detail=f"Stadt '{city}' nicht unterstützt."
        )
    
    # Daten für Fahrrad und E-Scooter getrennt 
    bike_data = fetch_bike_history_segments(bike_file_name)
    scooter_data = fetch_scooter_history_segments(city_key)
    
    # 3. Kombiniertes Ergebnis zurückgeben
    return {
        "bike": bike_data,
        "scooter": scooter_data
    }