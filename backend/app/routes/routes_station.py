from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime
import pandas as pd
import os

router = APIRouter(tags=["Stations"])

STATION_DATA_DIR = "backend/data/stations/"

@router.get("/station/{city}")
async def get_station_information(city: str):

    city = city.lower()

    if city == "stuttgart":
        file_name = "STU_regiorad_stationinfo.csv"
    elif city == "mannheim":
        file_name = "MA_nextbike_stationinfo.csv"
    elif city == "karlsruhe":
        file_name = "KA_nextbike_stationinfo.csv"
    else:
        raise HTTPException(status_code=404, detail="City not found")
    
    file_path = os.path.join(STATION_DATA_DIR, file_name)
    df_bike = pd.read_csv(file_path, encoding="utf-8")
    
    return df_bike.to_dict(orient="records")