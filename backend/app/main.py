from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes import routes_availability, routes_station
from backend.app.routes import (
    routes_pois,
    routes_pricing_isochrone,
    routes_geofencing_zones,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_availability.router)
app.include_router(routes_station.router)
app.include_router(routes_pois.router)
app.include_router(routes_pricing_isochrone.router)
app.include_router(routes_geofencing_zones.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}