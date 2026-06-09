from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime

router = APIRouter(tags=["Availability"])

NEXTBIKE_MA_STATIONSTATUS_URL = "https://api.mobidata-bw.de/sharing/gbfs/v2/nextbike_nn/station_status"

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

@router.get("/availability/history/{station_id}")
async def get_history_availability(station_id: int):
    

    return