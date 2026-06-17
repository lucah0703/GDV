from fastapi import FastAPI

from backend.app.routes import routes_availability, routes_station #routen von Lucia
from backend.app.routes import routes_pois, routes_pricing_isochrone, routes_geofencing_zones #routen von Luca

app = FastAPI()

app.include_router(routes_availability.router)
app.include_router(routes_station.router)

app.include_router(routes_pois.router)
app.include_router(routes_pricing_isochrone.router)
app.include_router(routes_geofencing_zones.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}