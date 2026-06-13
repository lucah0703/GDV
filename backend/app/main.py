from fastapi import FastAPI
from backend.app.routes import routes, routes_availability, routes_station

app = FastAPI()

app.include_router(routes.router)
app.include_router(routes_availability.router)
app.include_router(routes_station.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}