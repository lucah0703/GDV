from fastapi import APIRouter

from backend.app.services.pricing_isochrone_service import get_pricing_isochrone

router = APIRouter(tags=["Pricing Isochrone"])


@router.get("/pricingisochrone/{city}/{uni}/{budget}")
def pricing_isochrone(city: str, uni: str, budget: float):

    response = {
        "city": city,
        "uni": uni,
        "budget": budget,
        "results": {
            "e-scooter": [],
            "bike": []
        }
    }

    try:
        response["results"]["e-scooter"] = get_pricing_isochrone(
            city=city,
            uni=uni,
            budget=budget,
            vehicle_type="e-scooter"
        )
    except Exception as e:
        print(e)

    try:
        response["results"]["bike"] = get_pricing_isochrone(
            city=city,
            uni=uni,
            budget=budget,
            vehicle_type="bike"
        )
    except Exception as e:
        print(e)

    return response