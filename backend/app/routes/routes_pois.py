from fastapi import APIRouter

from backend.app.services.pois_service import (
    get_pois,
)


router = APIRouter(tags=["POIs"])


@router.get("/pois/{city}")
def pois(
    city: str,
    uni: str | None = None,
    category: str | None = None
):
    return get_pois(
        city=city,
        uni=uni,
        category=category
    )