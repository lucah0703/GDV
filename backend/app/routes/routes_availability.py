from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime
import pandas as pd
import os

router = APIRouter(tags=["Availability"])

MA_NEXTBIKE_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/nextbike_vn/station_status"
KA_NEXTBIKE_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/nextbike_fg/station_status"
STU_REGIORAD_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/regiorad_stuttgart/station_status"

STATION_DATA_DIR = "backend/data/stations/"
AVAILABILITY_DATA_DIR = "backend/data/availability"

@router.get("/availability/current/{city}")
async def get_current_availability(city: str):

    city = city.lower()

    if city == "stuttgart":
        gbfs_url = STU_REGIORAD_STATIONSTATUS_URL
        file_name = "STU_regiorad_stationinfo.csv"
    elif city == "mannheim":
        gbfs_url = MA_NEXTBIKE_STATIONSTATUS_URL
        file_name = "MA_nextbike_stationinfo.csv"
    elif city == "karlsruhe":
        gbfs_url = KA_NEXTBIKE_STATIONSTATUS_URL
        file_name = "KA_nextbike_stationinfo.csv"
    else:
        raise HTTPException(status_code=404, detail="City not found")

    gbfs_stationstatus = requests.get(gbfs_url).json()
    file_path = os.path.join(STATION_DATA_DIR, file_name)
    df_city = pd.read_csv(file_path, encoding="utf-8")
    allowed_station_ids = set(df_city["station_id"].astype(str))

    availabilities = []

    gbfs_stations = gbfs_stationstatus.get("data", {}).get("stations", [])

    for station in gbfs_stations:
        current_id = str(station.get("station_id"))

        if current_id in allowed_station_ids:

            timestamp = datetime.fromtimestamp(station.get("last_reported"))

            availabilities.append({
                "station_id": current_id,
                "num_bikes_available": station.get("num_bikes_available", 0),
                "last_reported": timestamp
            })

    return availabilities
    

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
        raise HTTPException(status_code=404, detail="Data not found")
        
    df = pd.read_csv(file_path)

    # 1. Zeitstempel bereinigen und Stunde extrahieren
    df['last_reported_clean'] = df['last_reported'].str.slice(0, 19)
    df['last_reported_clean'] = pd.to_datetime(df['last_reported_clean'])
    df['stunde'] = df['last_reported_clean'].dt.hour
    
    # 2. Tageszeiten-Segmente definieren (6-10, 10-16, 16-22)
    # Alles außerhalb (22 Uhr bis 6 Uhr morgens) wird hier ignoriert (wird zu NaN und fliegt raus)
    bins = [6, 10, 16, 22]
    labels = ["Morgens (6-10)", "Mittags (10-16)", "Abends (16-22)"]
    
    # include_lowest=True sorgt dafür, dass die 6 Uhr mitgezählt wird
    df['tageszeit'] = pd.cut(df['stunde'], bins=bins, labels=labels, include_lowest=True)
    
    # Zeilen ohne Zuweisung (Nachtstunden) löschen
    df = df.dropna(subset=['tageszeit'])

    # 3. Gruppieren nach Station UND der neuen Tageszeit
    df_segmented = df.groupby(['station_id', 'tageszeit'], observed=False)['num_bicycles_available'].mean().reset_index()
    df_segmented['num_bicycles_available'] = df_segmented['num_bicycles_available'].round(2)

    # 4. In das Frontend-Format umstrukturieren
    segments_by_station = []

    for station_id, group in df_segmented.groupby('station_id'):
        x_data = group['tageszeit'].astype(str).tolist()
        y_data = group['num_bicycles_available'].tolist()
        
        segments_by_station.append({
            "station_id": str(station_id),
            "x_data": x_data,  # ["Morgens (6-10)", "Mittags (10-16)", "Abends (16-22)"]
            "y_data": y_data   # [Durchschnittswerte passend dazu]
        })
    
    return segments_by_station