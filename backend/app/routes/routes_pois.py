from fastapi import APIRouter

from backend.app.services.poi_service import (
    fetch_pois,
    fetch_pois_summary
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


@router.get("/pois/{city}/summary")
def get_summary(
    city: str,
    uni: str | None = None,
    category: str | None = None
):
    return fetch_pois_summary(
        city=city,
        uni=uni,
        category=category
    )