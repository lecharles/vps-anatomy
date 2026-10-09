from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from routers import machine, services, modules, changes
from database import engine, Base
from core import scan_loop
from static_serve import mount_spa
import asyncio

OPENAPI_DESCRIPTION = """
VPS Anatomy exposes the facts a live AI-agent server gathers about itself.
Every endpoint answers one question the scanner can verify in milliseconds:
what is this machine, what is listening, who is alive, what changed.

The same data drives the educational site at `/`. Treat this reference as a
lab notebook: each endpoint is a lens on one layer of the system.

- **machine** — hardware and OS facts (cores, RAM, disk, uptime).
- **services** — TCP listeners, labeled by the port catalog.
- **modules** — the residents: agents, runtimes, containers, scheduler.
- **changes** — the diff between successive scans; the machine's diary.

Scans run every 30 seconds. Timestamps are UTC, written by the scanner.
"""

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
    version="0.3.0",
    description=OPENAPI_DESCRIPTION,
    docs_url=None,   # replaced by the themed page below
    redoc_url=None,
    openapi_tags=[
        {"name": "machine", "description": "Hardware and OS facts of the host."},
        {"name": "services", "description": "TCP listeners currently bound on the host."},
        {"name": "modules", "description": "Software residents (agents, runtimes, containers) and their liveness."},
        {"name": "changes", "description": "Events detected between scans — services and modules that started or stopped."},
    ],
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

# Themed API reference (Swagger UI + the site's token system).
@app.get("/docs", include_in_schema=False)
async def themed_docs():
    path = os.path.join(os.path.dirname(__file__), "static", "docs.html")
    return FileResponse(path)

# Mount SPA last (catches all routes)
mount_spa(app, "static")

@app.get("/api", include_in_schema=False)
async def api_root():
    return {"message": "VPS Anatomy API", "version": "0.3.0", "docs": "/docs", "schema": "/openapi.json"}
