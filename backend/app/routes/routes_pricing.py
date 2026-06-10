from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()

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
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_mannheim/system_pricing_plans",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/mannheim/system_pricing_plans.json",
        "vrnnextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vn/de/system_pricing_plans.json",
        "dbCallABike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"

    }
}


def fetch_pricing_plans(url: str):
    response = requests.get(url)
    response.raise_for_status()

    pricing_data = response.json()

    filtered_plans = []

    for plan in pricing_data.get("data", {}).get("plans", []):
        if plan.get("currency") != "EUR":
            continue

        filtered_plans.append({
            "plan_id": plan.get("plan_id"),
            "currency": plan.get("currency"),
            "price": plan.get("price"),
            "per_min_pricing": plan.get("per_min_pricing", [])
        })

    return filtered_plans


@router.get("/pricing")
def get_pricing(city: str, provider: str | None = None):
    city_providers = PRICING_URLS[city]

    if provider:
        plans = fetch_pricing_plans(city_providers[provider])

        return {
            "city": city,
            "provider": provider,
            "plans": plans
        }

    results = []

    for provider_name, pricing_url in city_providers.items():
        plans = fetch_pricing_plans(pricing_url)

        results.append({
            "provider": provider_name,
            "plans": plans
        })

    return {
        "city": city,
        "providers": results
    }