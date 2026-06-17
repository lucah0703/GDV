from fastapi import APIRouter

from backend.app.services.geofencingZones_service import (
    GEOFENCINGZONES_URLS,
    get_geofencing_zones
)


router = APIRouter()


@router.get("/geofencingzones")
def get_geofencing(
    city: str,
    provider: str | None = None
):

    result = get_geofencing_zones(
        city=city,
        provider=provider
    )

    return result