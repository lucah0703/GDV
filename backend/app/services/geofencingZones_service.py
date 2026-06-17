import requests


GEOFENCINGZONES_URLS = {
    "stuttgart": {
        "lime": "https://api.mobidata-bw.de/sharing/gbfs/v3/lime_bw/geofencing_zones",
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_stuttgart/geofencing_zones",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones",
        "dott": "https://gbfs.api.ridedott.com/public/v2/stuttgart/geofencing_zones.json",
    },

    "karlsruhe": {
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_karlsruhe/geofencing_zones",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones",
        "dott": "https://gbfs.api.ridedott.com/public/v2/karlsruhe/geofencing_zones.json",
    },

    "mannheim": {
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones",
        "dott": "https://gbfs.api.ridedott.com/public/v2/mannheim/geofencing_zones.json",
    }
}

def fetch_geofencing_data(url: str) -> dict:
    response = requests.get(url)
    response.raise_for_status()

    return response.json()


def extract_features(data: dict) -> list[dict]:
    geofencing_data = data.get("data")

    if "geofencing_zones" in geofencing_data:
        geofencing_data = geofencing_data["geofencing_zones"]

    return geofencing_data.get("features")


def get_geofencing_zones(
    city: str,
    provider: str
) -> dict:

    url = GEOFENCINGZONES_URLS.get(
        city,
    ).get(provider)

    data = fetch_geofencing_data(url)
    features = extract_features(data)

    zones = []

    for feature in features:
        geometry = feature.get("geometry")

        rules = feature.get(
            "properties",
            {}
        ).get("rules", [])

        ride_end_forbidden = any(
            rule.get("ride_end_allowed") is False
            for rule in rules
        )

        if not ride_end_forbidden:
            continue

        zones.append({
            "geometry": {
                "coordinates": geometry.get("coordinates")
            }
        })

    return {
        "city": city,
        "provider": provider,
        "zones": zones
    }