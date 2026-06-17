import requests


GEOFENCING_ZONES_URLS = {
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


def fetch_geofencing_zones(url: str) -> list[dict]:
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    return data.get("data").get("features")


def get_geofencing_zones(
    city: str,
    provider: str | None = None
) -> dict:

    providers = GEOFENCING_ZONES_URLS[city]

    if provider: # Optionaler Filter für einen bestimmten Anbieter
        selected_providers = {
            provider: providers[provider]
        }
    else:
        selected_providers = providers

    result = {
        "city": city,
        "providers": []
    }

    for provider_name, url in selected_providers.items():
        data = fetch_geofencing_zones(url)
        features = data

        geofencing_zones = []

        for feature in features:
            geometry = feature.get("geometry")

            rules = feature.get(
                "properties"
            ).get("rules")

            ride_end_forbidden = any(
                rule.get("ride_end_allowed") is False
                or rule.get("ride_allowed") is False
                for rule in rules
            )

            if not ride_end_forbidden:
                continue

            geofencing_zones.append({
                "geometry": {
                    "type": geometry.get("type"),
                    "coordinates": geometry.get("coordinates")
                }
            })

        result["providers"].append({
            "provider": provider_name,
            "geofencing_zones": geofencing_zones
        })

    return result