from fastapi import FastAPI

from backend.app.routes import routes_availability, routes_station #routen von Lucia
from backend.app.routes import routes_pois, routes_pricingIsochrone, routes_geofencingZones #routen von Luca

app = FastAPI()

app.include_router(routes_availability.router)
app.include_router(routes_station.router)

app.include_router(routes_pois.router)
app.include_router(routes_pricingIsochrone.router)
app.include_router(routes_geofencingZones.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}