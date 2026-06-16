from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes import routes_availability, routes_station #routen von Lucia
from backend.app.routes import routes_isochrone, routes_pois, routes_pricing #routen von Luca

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes_availability.router)
app.include_router(routes_station.router)

app.include_router(routes_pois.router)
app.include_router(routes_pricing.router)
app.include_router(routes_isochrone.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}