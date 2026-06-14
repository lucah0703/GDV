from fastapi import APIRouter
from backend.app.services.isochrone_service import get_isochrone_by_budget

router = APIRouter()


@router.get("/isochrone")
def isochrone(
    city: str,
    budget: float,
    uni: str
):
    return {
        "e-scooter": get_isochrone_by_budget(
            city=city,
            budget=budget,
            uni=uni,
            vehicle_type="e-scooter"
        ),
        "bike": get_isochrone_by_budget(
            city=city,
            budget=budget,
            uni=uni,
            vehicle_type="bike"
        )
    }