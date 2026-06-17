import math
import requests


ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNhYzM2MjczN2ZmMTQyMTk4NGE4NzNkYzg5ZmY0ODA3IiwiaCI6Im11cm11cjY0In0="

PLAN_IDS = {
    "stuttgart": {
        "lime": ["LMG:PricingPlan:M42W2NBOV7FPM"],
        "bolt": ["BLT:PricingPlan:cd3221d6-340e-55e0-964b-9f639b059697"],
        "voi": ["VOJ:PricingPlan:plan-scooter-366"], # unsicher
        "dott": ["68f10397-538d-4785-954d-028a6dca5df4"],

        "regioRadStuttgart": ["CAB:PricingPlan:9fcfe017-d9f6-35e9-8605-19637aa3ba60"],
        "dbCallABike": ["CAB:PricingPlan:cd69c83c-a695-3df9-bfbe-e1a967fb1f84"]
    },

    "karlsruhe": {
        "bolt": ["BLT:PricingPlan:cf4d9137-9acf-5e38-a221-1fbd7b0699f6"], # unsicher
        "voi": ["VOJ:PricingPlan:plan-scooter-366"], # unsicher
        "dott": ["1ba9b296-47d7-4062-bb8a-e85831e06364"],

        "kvv.nextbike": ["Rate0053"], # unsicher
        "dbCallABike": ["CAB:PricingPlan:cd69c83c-a695-3df9-bfbe-e1a967fb1f84"]
    },

    "mannheim": {
        "voi":  ["VOJ:PricingPlan:plan-scooter-366"], # unsicher
        "dott": ["a0add3e8-0ed2-4163-aa74-ef55932c0f0c"],

        "vrnnextbike": ["Rate0307"],
        "dbCallABike": ["CAB:PricingPlan:cd69c83c-a695-3df9-bfbe-e1a967fb1f84"]
    }
}

PRICING_URLS = {
    "stuttgart": {
        "lime": "https://api.mobidata-bw.de/sharing/gbfs/v3/lime_bw/system_pricing_plans",
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_stuttgart/system_pricing_plans",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/stuttgart/system_pricing_plans.json",
        
        "regioRadStuttgart": "https://api.mobidata-bw.de/sharing/gbfs/v3/regiorad_stuttgart/system_pricing_plans",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"
    },

    "karlsruhe": {
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_karlsruhe/system_pricing_plans",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/karlsruhe/system_pricing_plans.json",

        "kvv.nextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_fg/de/system_pricing_plans.json",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"
    },

    "mannheim": {
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/mannheim/system_pricing_plans.json",

        "vrnnextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vn/de/system_pricing_plans.json",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"
    }
}

PROVIDER_VEHICLE_TYPE = {
    "voi": "e-scooter",
    "dott": "e-scooter",
    "lime": "e-scooter",
    "bolt": "e-scooter",

    "vrnnextbike": "bike",
    "kvv.nextbike": "bike",
    "regioRadStuttgart": "bike",
    "dbCallABike": "bike",
}


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


def fetch_pricing_plans(url: str) -> list[dict]:
    response = requests.get(url)
    response.raise_for_status()

    data = response.json()
    return data.get("data").get("plans")



def get_max_minutes_for_budget(plan: dict, budget: float):
    base_price = plan["price"]
    rule = plan["per_min_pricing"][0] # nur erster Tarif, da die weitern eine hohe Startminute haben z.B. 166

    start = rule["start"]
    interval = rule["interval"]
    rate = rule["rate"]
    end = rule.get("end")

    remaining_budget = budget - base_price

    if remaining_budget < 0:
        return None

    possible_blocks = math.floor(remaining_budget / rate) # wie viele Intervalle können mit dem restlichen Budget gefahren werden
    minutes = start + possible_blocks * interval # wie viele Minuten können mit dem restlichen Budget gefahren werden

    if end and minutes > end: # Falls die Preisregel ein Ende hat, wird die Minutenanzahl auf dieses Ende begrenzt
        minutes = end
        possible_blocks = math.ceil((minutes - start) / interval) # Danach wird die benötigte Blockanzahl neu berechnet

    price = round(base_price + possible_blocks * rate, 2) # Am Ende wird der tatsächliche Preis berechnet

    return {
        "max_minutes": minutes,
        "price": price
    }


def get_provider_budget_results(
    city: str,
    budget: float,
    vehicle_type: str
) -> list[dict]:
    results = []

    for provider, relevant_ids in PLAN_IDS[city].items(): # Alle Anbieter der Stadt durchgehen
        if PROVIDER_VEHICLE_TYPE[provider] != vehicle_type: # Wenn der Anbieter nicht den gesuchten Fahrzeugtyp hat, wird er übersprungen
            continue

        url = PRICING_URLS[city][provider]
        plans = fetch_pricing_plans(url)

        for plan in plans:
            if plan["plan_id"] not in relevant_ids: # Wenn der Tarif nicht zu den relevanten Tarifen gehört, wird er übersprungen
                continue

            best = get_max_minutes_for_budget(
                plan=plan,
                budget=budget
            )

            if best is None or best["max_minutes"] <= 0:
                continue

            results.append({
                "provider": provider,
                "max_minutes": best["max_minutes"],
                "price": best["price"]
            })

    return results

def get_ors_profile(vehicle_type: str) -> str:
    if vehicle_type == "bike":
        return "cycling-regular"

    return "cycling-electric"


def fetch_isochrone(
    lon: float,
    lat: float,
    minutes: int,
    vehicle_type: str
) -> dict:
    profile = get_ors_profile(vehicle_type)

    url = f"https://api.openrouteservice.org/v2/isochrones/{profile}"

    body = {
        "locations": [[lon, lat]],
        "range_type": "time",
        "range": [minutes * 60],
        "location_type": "start"
    } # Berechnet das Isochrone um die Uni herum, basierend auf der maximalen Fahrzeit, die mit dem Budget erreicht werden kann

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=body, headers=headers)
    response.raise_for_status()

    return response.json()


def get_pricingIsochrone(
    city: str,
    budget: float,
    uni: str,
    vehicle_type: str
) -> list[dict]:
    location = UNI[city][uni]

    results = get_provider_budget_results(
        city=city,
        budget=budget,
        vehicle_type=vehicle_type
    )

    for result in results:
        isochrone = fetch_isochrone(
            lon=location["lon"],
            lat=location["lat"],
            minutes=result["max_minutes"],
            vehicle_type=vehicle_type
        )

        result["geometry"] = isochrone["features"][0]["geometry"]

    return results