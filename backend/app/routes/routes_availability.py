from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime
import pandas as pd

router = APIRouter(tags=["Availability"])

#TODO: URL für Karlsruhe und Stuttgart finden
NEXTBIKE_MA_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/nextbike_vn/station_status"


#TODO: Ausgewählte Stadt vom Frontend bekommen
@router.get("/availability/current/{station_id}")
async def get_current_availability(station_id: str):

    gbfs_stationstatus = requests.get(NEXTBIKE_MA_STATIONSTATUS_URL).json()

    station = next(
    (s for s in gbfs_stationstatus["data"]["stations"]
     if s["station_id"] == station_id),
    None
    )

    # Minimaler Debugging
    if station is None:
        raise HTTPException(status_code=404, detail="Station not found")

    return {
        "station_id": station_id,
        "num_bikes_available": station["num_bikes_available"],
        "last_reported": datetime.fromtimestamp(station["last_reported"])
    } 

#TODO: CSV-Datei Umfang festlegen
@router.get("/availability/history/{station_id}")
async def get_history_availability(station_id: str):
    
    df = pd.read_csv("backend/data/availability/wanted_kw21.csv")

    df['last_reported_clean'] = df['last_reported'].str.slice(0, 19)
    df['last_reported_clean'] = pd.to_datetime(df['last_reported_clean'])

    df_filtered = df[df['station_id'] == station_id].copy()

    if df_filtered.empty:
        raise HTTPException(status_code=404, detail="Station not found")

    df_filtered['stunde'] = df_filtered['last_reported_clean'].dt.hour
    df_hourly = df_filtered.groupby('stunde')['num_bicycles_available'].mean().reset_index()
    df_hourly['num_bicycles_available'] = df_hourly['num_bicycles_available'].round(2)

    x_data = df_hourly['stunde'].tolist()
    y_data = df_hourly['num_bicycles_available'].tolist()
    
    return {
        "x_data":x_data,
        "y_data": y_data
    }