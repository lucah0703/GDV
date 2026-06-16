from fastapi import APIRouter
from backend.app.services.pricing_service import get_all_pricing_plans, get_pricing_by_budget

router = APIRouter()

@router.get("/pricing")
def pricing(
    city: str,
    budget: float
):
    return {
        "e-scooter": get_pricing_by_budget(
            city=city,
            budget=budget,
            vehicle_type="e-scooter"
        ),
        "bike": get_pricing_by_budget(
            city=city,
            budget=budget,
            vehicle_type="bike"
        )
    }

@router.get("/pricing/all")
def pricing_plans():
    return {
        "e-scooter": get_all_pricing_plans(vehicle_type="e-scooter"),
        "bike": get_all_pricing_plans(vehicle_type="bike")
    }