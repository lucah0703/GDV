from fastapi import APIRouter

from backend.app.services.geofencing_zones_service import (
    get_geofencing_zones
)


router = APIRouter(tags=["Geofencing Zones"])


@router.get("/geofencingzones/{city}")
def get_geofencing_zones(
    city: str,
    provider: str | None = None
):

    result = get_geofencing_zones(
        city=city,
        provider=provider
    )

    return result