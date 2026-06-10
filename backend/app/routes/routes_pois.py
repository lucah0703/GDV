from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import geopandas as gpd
import json

router = APIRouter()

POIS_PATH = "backend/app/services/pois.geojson"
pois_gdf = gpd.read_file(POIS_PATH)


@router.get("/pois")
def get_pois(
    city: str,
    uni: str | None = None,
    category: str | None = None
):
    if not city:
        raise HTTPException(
            status_code=400,
            detail="city darf nicht leer sein."
        )

    gdf = pois_gdf.copy()
    gdf = gdf[gdf["city"] == city]

    if uni:
        gdf = gdf[gdf["uni"] == uni]

    if category:
        gdf = gdf[gdf["category"] == category]

    if gdf.empty:
        raise HTTPException(
            status_code=404,
            detail="Keine passenden POIs gefunden."
        )

    return JSONResponse(content=json.loads(gdf.to_json()))

@router.get("/pois/summary")
def get_summary(
    city: str,
    uni: str | None = None,
    category: str | None = None
):
    if not city:
        raise HTTPException(
            status_code=400,
            detail="city darf nicht leer sein."
        )

    gdf = pois_gdf.copy()
    gdf = gdf[gdf["city"] == city]

    if uni:
        gdf = gdf[gdf["uni"] == uni]

    if category:
        gdf = gdf[gdf["category"] == category]

    # Nur bei Statistik ohne Uni doppelte POIs entfernen
    if not uni:
        gdf = gdf.drop_duplicates(subset=["id", "category"])

    if gdf.empty:
        raise HTTPException(
            status_code=404,
            detail="Keine passenden POIs gefunden."
        )

    counts = gdf["category"].value_counts().to_dict()

    return {
        "city": city,
        "uni": uni,
        "category": category,
        "total": len(gdf),
        "by_category": [
            {"category": "bahnhoefe", "count": counts.get("bahnhoefe", 0)},
            {"category": "wohnheime", "count": counts.get("wohnheime", 0)},
            {"category": "sporteinrichtungen", "count": counts.get("sporteinrichtungen", 0)}
        ]
    }