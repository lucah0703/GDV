import os
import requests
import numpy as np
import pandas as pd
from datetime import datetime
from fastapi import HTTPException
from shapely import wkt

STATION_DATA_DIR = "backend/data/stations/"
AVAILABILITY_DATA_DIR = "backend/data/availability/bike"
SCOOTER_AVAILABILTY_DATA_DIR = "backend/data/availability/scooter"

def haversine_distance(lat1, lon1, lat2, lon2):
    # Umrechnung in Bogenmaß (Radianten)
    lon1, lat1, lon2, lat2 = map(np.radians, [lon1, lat1, lon2, lat2])
    
    # Haversine-Formel
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    # Erdradius in Metern (6371000)
    meters = 6371000 * c
    return meters

def fetch_bike_availability(bike_gbfs_url: str, file_name: str) -> list:
    try:
        gbfs_stationstatus = requests.get(bike_gbfs_url).json()
    except Exception as e:
        print(f"Erorr Bike-API: {e}")
        return []

    file_path = os.path.join(STATION_DATA_DIR, file_name)
    if not os.path.exists(file_path):
        return []
        
    df_city = pd.read_csv(file_path, encoding="utf-8")
    allowed_station_ids = set(df_city["station_id"].astype(str))

    bike_availabilities = []
    gbfs_stations = gbfs_stationstatus.get("data", {}).get("stations", [])

    for station in gbfs_stations:
        current_id = str(station.get("station_id"))

        if current_id in allowed_station_ids:
            last_reported_raw = station.get("last_reported")
            timestamp = datetime.fromtimestamp(last_reported_raw).isoformat() if last_reported_raw else None

            bike_availabilities.append({
                "station_id": current_id,
                "num_bikes_available": station.get("num_bikes_available", 0),
                "last_reported": timestamp
            })
            
    return bike_availabilities

def fetch_scooter_availability(scooter_gbfs_urls: list, uni_lat: float, uni_lon: float) -> list:
    scooter_availabilities = []

    for scooter_info in scooter_gbfs_urls:
        provider_name = scooter_info["provider"]
        scooter_url = scooter_info["url"]

        try:
            res_gbfs = requests.get(scooter_url).json()
            bikes_list = res_gbfs.get("data", {}).get("bikes", [])
            
            if not bikes_list:
                continue
                
            df_scooter = pd.DataFrame(bikes_list)

            # Distanz berechnen
            df_scooter['distance_to_uni'] = haversine_distance(
                df_scooter["lat"], df_scooter["lon"],
                uni_lat, uni_lon
            )

            # Auf 200 Meter filtern
            df_geofence = df_scooter[df_scooter["distance_to_uni"] <= 200].copy()

            for row in df_geofence.itertuples():
                scooter_ts = getattr(row, "last_reported", None)
                scooter_timestamp = datetime.fromtimestamp(scooter_ts).isoformat() if scooter_ts else None
                
                scooter_availabilities.append({
                    "bike_id": str(row.bike_id),
                    "provider": provider_name,
                    "lat": float(row.lat),
                    "lon": float(row.lon),
                    "last_reported": scooter_timestamp,
                    "current_fuel_percent": int(row.current_fuel_percent) if hasattr(row, "current_fuel_percent") and pd.notna(row.current_fuel_percent) else None,
                    "distance_to_uni": round(float(row.distance_to_uni), 1)
                })
        except Exception as e:
            print(f"Error while retrieving info from {provider_name}: {e}")
            continue
            
    return scooter_availabilities

def fetch_bike_history_segments(file_name: str) -> list:
    file_path = os.path.join(AVAILABILITY_DATA_DIR, file_name)
    if not os.path.exists(file_path):
        return []
        
    df = pd.read_csv(file_path)

    df['last_reported_clean'] = df['last_reported'].str.slice(0, 19)
    df['last_reported_clean'] = pd.to_datetime(df['last_reported_clean'])
    df['stunde'] = df['last_reported_clean'].dt.hour
    
    bins = [6, 10, 16, 22]
    labels = ["Morgens (6-10)", "Mittags (10-16)", "Abends (16-22)"]
    df['tageszeit'] = pd.cut(df['stunde'], bins=bins, labels=labels, include_lowest=True)
    df = df.dropna(subset=['tageszeit'])

    df_segmented = df.groupby(['station_id', 'tageszeit'], observed=False)['num_bicycles_available'].mean().reset_index()
    df_segmented['num_bicycles_available'] = df_segmented['num_bicycles_available'].round(2)

    segments_by_station = []
    for station_id, group in df_segmented.groupby('station_id'):
        x_data = group['tageszeit'].astype(str).tolist()
        y_data = [None if pd.isna(val) else val for val in group['num_bicycles_available'].tolist()]
        
        segments_by_station.append({
            "station_id": str(station_id),
            "x_data": x_data,
            "y_data": y_data
        })
    return segments_by_station

def fetch_scooter_history_segments(city_key: str) -> list:
    file_path = os.path.join(SCOOTER_AVAILABILTY_DATA_DIR, f"{city_key}.csv")
    
    if not os.path.exists(file_path):
        return []
        
    df = pd.read_csv(file_path, usecols=["geometry"])
    if df.empty:
        return []
        
    # WKT in Lat/Lon umwandeln und runden
    df["point"] = df["geometry"].apply(wkt.loads)
    df["lat"] = df["point"].apply(lambda p: round(p.y, 5))
    df["lon"] = df["point"].apply(lambda p: round(p.x, 5))
    
    # Als Liste von Paaren extrahieren, also: [[lat, lon], [lat, lon], ...]
    coords_list = df[["lat", "lon"]].values.tolist()
    
    return coords_list