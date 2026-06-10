from fastapi import FastAPI
from backend.app.routes import routes_pois, routes_pricing

app = FastAPI()

app.include_router(routes_pois.router)
app.include_router(routes_pricing.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}