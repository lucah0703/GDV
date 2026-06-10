from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()

PRICING_URLS = {
    "stuttgart": {
        "lime": "https://api.mobidata-bw.de/sharing/gbfs/v3/lime_bw/system_pricing_plans",
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_stuttgart/system_pricing_plans",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/stuttgart/system_pricing_plans.json",
        "regioradstuttgart": "https://api.mobidata-bw.de/sharing/gbfs/v3/regiorad_stuttgart/system_pricing_plans",
        "dbcallabike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"
    },
    "karlsruhe": {
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_karlsruhe/system_pricing_plans",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/karlsruhe/system_pricing_plans.json",
        "kvvnextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_fg/de/system_pricing_plans.json",
        "dbcallabike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"

    },
    "mannheim": {
        "bolt": "https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_mannheim/system_pricing_plans",
        "voi":  "https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans",
        "dott": "https://gbfs.api.ridedott.com/public/v2/mannheim/system_pricing_plans.json",
        "vrnnextbike": "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vn/de/system_pricing_plans.json",
        "dbcallabike": "https://api.mobidata-bw.de/sharing/gbfs/v3/callabike/system_pricing_plans"

    }
}


@router.get("/pricing")
def get_pricing(city: str, provider: str):
    city = city.lower().strip()
    provider = provider.lower().strip()

    if city not in PRICING_URLS:
        raise HTTPException(
            status_code=404,
            detail="Stadt nicht gefunden."
        )

    if provider not in PRICING_URLS[city]:
        raise HTTPException(
            status_code=404,
            detail="Anbieter nicht gefunden."
        )

    pricing_url = PRICING_URLS[city][provider]

    response = requests.get(pricing_url, timeout=10)
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

    return {
        "city": city,
        "provider": provider,
        "plans": filtered_plans
    }