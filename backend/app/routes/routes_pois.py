from fastapi import APIRouter

from backend.app.services.pois_service import (
    fetch_pois,
)


router = APIRouter(tags=["POIs"])


@router.get("/pois/{city}")
def get_pois(
    city: str,
    uni: str | None = None,
    category: str | None = None
):
    return fetch_pois(
        city=city,
        uni=uni,
        category=category
    )