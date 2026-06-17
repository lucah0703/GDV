from fastapi import APIRouter
from backend.app.services.pricing_isochrone_service import get_pricing_isochrone

router = APIRouter(tags=["Pricing Isochrone"])


@router.get("/pricingisochrone/{city}/{budget}/{uni}")
def pricing(
    city: str,
    budget: float,
    uni: str
):
    response = {
        "city": city,
        "budget": budget,
        "uni": uni
    }

    response["results"] = {
        "e-scooter": get_pricing_isochrone(
            city=city,
            budget=budget,
            uni=uni,
            vehicle_type="e-scooter"
        ),
        "bike": get_pricing_isochrone(
            city=city,
            budget=budget,
            uni=uni,
            vehicle_type="bike"
        )
    }

    return response