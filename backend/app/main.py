from fastapi import FastAPI
from backend.app.routes import routes

app = FastAPI()

app.include_router(routes.router)
app.include_router(routes_availability.router)

@app.get("/")
def root():
    return {"message": "Backend läuft"}