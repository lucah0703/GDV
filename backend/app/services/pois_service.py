import json
import geopandas as gpd
import pandas as pd
from pathlib import Path


POIS_DIR = Path("backend/data/pois")


def ensure_column(gdf, column, default=None):
    if column not in gdf.columns:
        gdf[column] = default
    return gdf


def build_address(row):
    street = row["addr:street"]
    housenumber = row["addr:housenumber"]

    if pd.notna(street) and pd.notna(housenumber):
        return f"{street} {housenumber}"

    if pd.notna(street):
        return street

    return None


def add_metadata(gdf, path):
    category = path.stem
    uni = path.parent.name
    city = path.parent.parent.name

    gdf["city"] = city
    gdf["uni"] = uni
    gdf["category"] = category

    return gdf


def load_bahnhoefe(path):
    gdf = gpd.read_file(path)
    gdf = add_metadata(gdf, path)

    gdf = ensure_column(gdf, "id")
    gdf = ensure_column(gdf, "name")

    gdf["name"] = gdf["name"].fillna("Bahnhof")

    return gdf


def load_wohnheime(path):
    gdf = gpd.read_file(path)
    gdf = add_metadata(gdf, path)

    gdf = ensure_column(gdf, "id")
    gdf = ensure_column(gdf, "addr:housename")
    gdf = ensure_column(gdf, "name")
    gdf = ensure_column(gdf, "addr:street")
    gdf = ensure_column(gdf, "addr:housenumber")

    gdf["name"] = (
        gdf["addr:housename"]
        .fillna(gdf["name"])
        .fillna("Wohnheim")
    )

    gdf["address"] = gdf.apply(build_address, axis=1)

    return gdf


def load_sporteinrichtungen(path):
    gdf = gpd.read_file(path)
    gdf = add_metadata(gdf, path)

    gdf = ensure_column(gdf, "id")
    gdf = ensure_column(gdf, "addr:housename")
    gdf = ensure_column(gdf, "name")
    gdf = ensure_column(gdf, "addr:street")
    gdf = ensure_column(gdf, "addr:housenumber")
    gdf = ensure_column(gdf, "sportart")

    gdf["name"] = (
        gdf["addr:housename"]
        .fillna(gdf["name"])
        .fillna("Sporteinrichtung")
    )

    gdf["address"] = gdf.apply(build_address, axis=1)

    return gdf


POIS = {
    "bahnhoefe": load_bahnhoefe,
    "wohnheime": load_wohnheime,
    "sporteinrichtungen": load_sporteinrichtungen
}


def build_pois_file():
    all_gdfs = []

    for path in POIS_DIR.glob("*/*/*.geojson"):
        category = path.stem
        pois = POIS.get(category)

        if pois is None:
            continue

        gdf = pois(path)
        all_gdfs.append(gdf)

    pois = pd.concat(
        all_gdfs,
        ignore_index=True
    )

    pois = gpd.GeoDataFrame(
        pois,
        geometry="geometry",
        crs="EPSG:4326"
    )

    pois = pois[
        [
            "id",
            "city",
            "uni",
            "category",
            "name",
            "address",
            "sportart",
            "geometry"
        ]
    ].copy()

    pois.to_file(
        "backend/data/pois/pois.geojson",
        driver="GeoJSON"
    )


pois_gdf = gpd.read_file("backend/data/pois/pois.geojson")


def get_pois(
    city: str,
    uni: str | None = None,
    category: str | None = None
) -> dict:
    gdf = pois_gdf.copy()

    gdf = gdf[gdf["city"] == city]

    if uni:
        gdf = gdf[gdf["uni"] == uni]

    if category:
        gdf = gdf[gdf["category"] == category]

    # Ohne Uni doppelte POIs entfernen
    if not uni:
        gdf = gdf.drop_duplicates(
            subset=["id", "category"]
        )

    counts = gdf["category"].value_counts().to_dict()

    return {
        "city": city,
        "uni": uni,
        "category": category,
        "total": len(gdf),
        "by_category": [
            {
                "category": "bahnhoefe",
                "count": counts.get("bahnhoefe", 0)
            },
            {
                "category": "wohnheime",
                "count": counts.get("wohnheime", 0)
            },
            {
                "category": "sporteinrichtungen",
                "count": counts.get("sporteinrichtungen", 0)
            }
        ],
        "pois": json.loads(gdf.to_json())
    }


if __name__ == "__main__": # Nur zum einmaligen Erstellen der pois.geojson
    build_pois_file()