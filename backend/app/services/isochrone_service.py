import requests

from backend.app.services.pricing_service import get_pricing_by_budget

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNhYzM2MjczN2ZmMTQyMTk4NGE4NzNkYzg5ZmY0ODA3IiwiaCI6Im11cm11cjY0In0="

UNI = {
    "stuttgart": {
        "uni": {
            "lat": 48.7817,
            "lon": 9.1752
        },
        "uniHohenheim": {
            "lat": 48.7125,
            "lon": 9.214
        },
        "dhbw": {
            "lat": 48.7823,
            "lon": 9.17622
        }
    },

    "karlsruhe": {
        "kit": {
            "lat": 49.00947,
            "lon": 8.41167
        },
        "hochschule": {
            "lat": 49.015556,
            "lon": 8.390833
        },
        "paedagogischeHochschule": {
            "lat": 49.013749,
            "lon": 8.392738
        }
    },

    "mannheim": {
        "uni": {
            "lat": 49.483196,
            "lon": 8.464687
        },
        "hochschule": {
            "lat": 49.469557,
            "lon": 8.482207
        },
        "dhbw": {
            "lat": 49.474444,
            "lon": 8.534722
        }
    },
}


def get_ors_profile(vehicle_type: str):
    if vehicle_type == "bike":
        return "cycling-regular"

    if vehicle_type == "e-scooter":
        return "cycling-electric"


def fetch_isochrone(lon: float, lat: float, minutes: int, vehicle_type: str):
    profile = get_ors_profile(vehicle_type)

    url = f"https://api.openrouteservice.org/v2/isochrones/{profile}"

    body = {
        "locations": [[lon, lat]],
        "range_type": "time",
        "range": [minutes * 60],
        "location_type": "start"
    }

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=body, headers=headers)
    response.raise_for_status()

    return response.json()


def get_isochrone_base(
    city: str,
    budget: float,
    uni: str
):
    location = UNI[city][uni]

    return {
        "city": city,
        "budget": budget,
        "uni": {
            "name": uni,
            "lat": location["lat"],
            "lon": location["lon"]
        },
        "results": {}
    }


def get_isochrone_by_budget(
    city: str,
    budget: float,
    uni: str,
    vehicle_type: str
):
    location = UNI[city][uni]

    pricing_results = get_pricing_by_budget(
        city=city,
        budget=budget,
        vehicle_type=vehicle_type
    )

    results = []

    for provider_result in pricing_results:
        isochrone = fetch_isochrone(
            lon=location["lon"],
            lat=location["lat"],
            minutes=provider_result["max_minutes"],
            vehicle_type=vehicle_type
        )

        results.append({
            **provider_result,
            "isochrone": {
                "type": isochrone["type"],
                "features": isochrone["features"]
            }
        })

    return results