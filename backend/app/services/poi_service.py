import geopandas as gpd
import pandas as pd
from pathlib import Path

#gdf =  GeoDataFrame

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


def add_metadata_from_filename(gdf, path):

    parts = path.stem.split("_")

    city = parts[0]
    university = parts[1]
    category = parts[2]

    gdf["city"] = city
    gdf["university"] = university
    gdf["category"] = category

    return gdf

def load_bahnhoefe(path):
    gdf = gpd.read_file(path)
    gdf = add_metadata_from_filename(gdf, path)

    gdf = ensure_column(gdf, "id")
    gdf = ensure_column(gdf, "name")

    gdf["name"] = gdf["name"].fillna("Bahnhof")

    return gdf


def load_wohnheime(path):
    gdf = gpd.read_file(path)
    gdf = add_metadata_from_filename(gdf, path)

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

    gdf["adress"] = gdf.apply(build_address, axis=1)

    return gdf


def load_sport(path):
    gdf = gpd.read_file(path)
    gdf = add_metadata_from_filename(gdf, path)

    gdf = ensure_column(gdf, "id")
    gdf = ensure_column(gdf, "addr:housename")
    gdf = ensure_column(gdf, "name")
    gdf = ensure_column(gdf, "addr:street")
    gdf = ensure_column(gdf, "addr:housenumber")
    gdf = ensure_column(gdf, "sport")

    gdf["name"] = (
        gdf["addr:housename"]
        .fillna(gdf["name"])
        .fillna("Sporteinrichtung")
    )

    gdf["adress"] = gdf.apply(build_address, axis=1)

    return gdf


all_gdfs = []

for path in POIS_DIR.glob("*.geojson"):
    parts = path.stem.split("_")

    if len(parts) != 3:
        continue

    category = parts[2]

    if category == "bahnhoefe":
        gdf = load_bahnhoefe(path)

    elif category == "wohnheime":
        gdf = load_wohnheime(path)

    elif category == "sport":
        gdf = load_sport(path)

    else:
        continue

    all_gdfs.append(gdf)


pois = pd.concat(all_gdfs, ignore_index=True)

pois = gpd.GeoDataFrame(pois, geometry="geometry", crs="EPSG:4326")

pois["lon"] = pois.geometry.x
pois["lat"] = pois.geometry.y

pois_clean = pois[
    [
        "id",
        "city",
        "university",
        "category",
        "name",
        "adress",
        "sport",
        "lon",
        "lat",
        "geometry",
    ]
].copy()

pois_clean.to_file(
    "backend/app/services/pois_clean.geojson",
    driver="GeoJSON"
)