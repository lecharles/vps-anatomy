from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import machine, services, modules, changes
from database import engine, Base
from core import scan_loop
from static_serve import mount_spa
import asyncio

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Start background scanner
    task = asyncio.create_task(scan_loop())
    yield
    task.cancel()

app = FastAPI(
    title="VPS Anatomy API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(machine.router)
app.include_router(services.router)
app.include_router(modules.router)
app.include_router(changes.router)

# Mount SPA last (catches all routes)
mount_spa(app, "static")

@app.get("/api")
async def api_root():
    return {"message": "VPS Anatomy API", "version": "0.2.0"}
