from fastapi import APIRouter
from fastapi.responses import JSONResponse
import geopandas as gpd
import json

router = APIRouter()

@router.get("/pois")
def get_pois(category: str | None = None):
    gdf = gpd.read_file("backend/app/services/pois_clean.geojson")

    if category:
        gdf = gdf[gdf["category"] == category]

    return JSONResponse(content=json.loads(gdf.to_json()))