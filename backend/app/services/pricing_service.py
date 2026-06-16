import math
import requests

PLAN_IDS = {
    "stuttgart": {
        "lime": ["LMG:PricingPlan:M42W2NBOV7FPM"],
        "bolt": ["BLT:PricingPlan:cd3221d6-340e-55e0-964b-9f639b059697"],
        "voi": [],
        "dott": ["68f10397-538d-4785-954d-028a6dca5df4"],

        "regioRadStuttgart": ["CAB:PricingPlan:9fcfe017-d9f6-35e9-8605-19637aa3ba60"],
        "dbCallABike": ["CAB:PricingPlan:cd69c83c-a695-3df9-bfbe-e1a967fb1f84"]
    },

    "karlsruhe": {
        "bolt": [],
        "voi": [],
        "dott": ["1ba9b296-47d7-4062-bb8a-e85831e06364"],

        "kvv.nextbike": [],
        "dbCallABike": ["CAB:PricingPlan:cd69c83c-a695-3df9-bfbe-e1a967fb1f84"]
    },

    "mannheim": {
        "voi":  [],
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

PROVIDER_VEHICLE_TYPES = {
    "voi": "e-scooter",
    "dott": "e-scooter",
    "lime": "e-scooter",
    "bolt": "e-scooter",

    "vrnnextbike": "bike",
    "kvv.nextbike": "bike",
    "regioRadStuttgart": "bike",
    "dbCallABike": "bike",
}


def fetch_pricing_plans(url: str) -> list[dict]:
    response = requests.get(url)
    response.raise_for_status()

    data = response.json()
    return data.get("data").get("plans")


def prepare_pricing_plans(city: str, provider: str, plans: list[dict]) -> list[dict]:
    relevant_ids = PLAN_IDS[city][provider]

    filtered_plans = []

    for plan in plans:
        if plan["plan_id"] not in relevant_ids:
            continue

        filtered_plans.append({
            "plan_id": plan["plan_id"],
            "currency": plan["currency"],
            "price": plan["price"],
            "per_min_pricing": [plan["per_min_pricing"][0]]
        })

    return filtered_plans


def get_all_pricing_plans(vehicle_type: str):
    results = []

    for city, providers in PRICING_URLS.items():
        for provider, url in providers.items():
            provider_vehicle_type = PROVIDER_VEHICLE_TYPES[provider]

            if provider_vehicle_type != vehicle_type:
                continue

            plans = fetch_pricing_plans(url)
            plans = prepare_pricing_plans(city, provider, plans)

            for plan in plans:
                results.append({
                    "city": city,
                    "provider": provider,
                    "plan_id": plan["plan_id"],
                    "currency": plan["currency"],
                    "price": plan["price"],
                    "per_min_pricing": plan["per_min_pricing"]
                })

    return results


def get_max_minutes_for_budget(plan: dict, budget: float):
    total = plan["price"]
    rule = plan["per_min_pricing"][0]

    start = rule["start"]
    interval = rule["interval"]
    rate = rule["rate"]
    end = rule.get("end")

    remaining_budget = budget - total

    if remaining_budget < 0:
        return None

    possible_blocks = math.floor(remaining_budget / rate)
    minutes = start + possible_blocks * interval

    if end and minutes > end:
        minutes = end
        possible_blocks = math.ceil((minutes - start) / interval)

    price = round(total + possible_blocks * rate, 2)

    return {
        "minutes": minutes,
        "price": price
    }


def get_pricing_by_budget(city: str, budget: float, vehicle_type: str):
    results = []

    plans = get_all_pricing_plans(vehicle_type)

    for plan in plans:
        if plan["city"] != city:
            continue

        best = get_max_minutes_for_budget(plan, budget)

        if not best:
            continue

        if best["minutes"] <= 0:
            continue

        results.append({
            "provider": plan["provider"],
            "plan_id": plan["plan_id"],
            "max_minutes": best["minutes"],
            "price": best["price"],
            "currency": plan["currency"],
            "label": f"{plan['provider']}: bis zu {best['minutes']} Minuten für {best['price']:.2f} €"
        })

    return results