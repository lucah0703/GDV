from fastapi import APIRouter
from backend.app.services.pricingIsochrone_service import get_pricingIsochrone

router = APIRouter()


@router.get("/pricing/{city}/{budget}/{uni}")
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
        "e-scooter": get_pricingIsochrone(
            city=city,
            budget=budget,
            uni=uni,
            vehicle_type="e-scooter"
        ),
        "bike": get_pricingIsochrone(
            city=city,
            budget=budget,
            uni=uni,
            vehicle_type="bike"
        )
    }

    return response