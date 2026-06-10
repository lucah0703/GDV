from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import geopandas as gpd
import json

router = APIRouter()

POIS_PATH = "backend/app/services/pois_clean.geojson"
pois_gdf = gpd.read_file(POIS_PATH)


@router.get("/pois")
def get_pois(
    city: str,
    category: str | None = None
):
    gdf = pois_gdf.copy()

    gdf = gdf[gdf["city"] == city]

    if category:
        gdf = gdf[gdf["category"] == category]

    if gdf.empty:
        raise HTTPException(
            status_code=404,
            detail="Keine passenden POIs gefunden."
        )

    return JSONResponse(content=json.loads(gdf.to_json()))


@router.get("/categories")
def get_categories(city: str):
    gdf = pois_gdf.copy()

    gdf = gdf[gdf["city"] == city]

    if gdf.empty:
        raise HTTPException(
            status_code=404,
            detail="Keine POIs für diese Stadt gefunden."
        )

    categories = sorted(gdf["category"].unique().tolist())

    return {
        "city": city,
        "categories": categories
    }


@router.get("/summary")
def get_summary(city: str):
    gdf = pois_gdf.copy()

    gdf = gdf[gdf["city"] == city]

    if gdf.empty:
        raise HTTPException(
            status_code=404,
            detail="Keine POIs für diese Stadt gefunden."
        )

    summary = (
        gdf["category"]
        .value_counts()
        .reset_index()
    )

    summary.columns = ["category", "count"]

    return {
        "city": city,
        "total": len(gdf),
        "categories": summary.to_dict(orient="records")
    }