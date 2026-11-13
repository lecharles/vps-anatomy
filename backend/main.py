from contextlib import asynccontextmanager
from datetime import datetime
import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from routers import machine, services, modules, changes, trends, latency
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import MachineState
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
- **changes** — the diff between successive scans.
- **trends** — hourly rollups of the recorded history, for charts.
- **latency** — loopback handshake times for the ports this scan found:
  the machine measuring its own cheapest hops, in milliseconds.
- **health** — liveness of the app and of the scan loop behind it.

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
        {"name": "trends", "description": "Hourly rollups of the scan history: listeners, live residents, RAM and disk."},
        {"name": "latency", "description": "Measured loopback TCP handshake times — the localhost hops, in ms."},
        {"name": "health", "description": "Liveness of the app and of the scan loop behind it."},
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
app.include_router(trends.router)
app.include_router(latency.router)

# Themed API reference (Swagger UI + the site's token system).
@app.get("/docs", include_in_schema=False)
async def themed_docs():
    path = os.path.join(os.path.dirname(__file__), "static", "docs.html")
    return FileResponse(path)

# Liveness. Defined before the SPA catch-all so the static mount can never
# swallow it. 200 only while the scan loop is writing — the scanner lands a
# row every 30s, so four missed passes means the loop is not healthy.
HEALTHY_MAX_AGE_S = 120

@app.get(
    "/healthz",
    tags=["health"],
    summary="Liveness + scanner freshness",
    description=(
        "200 when the scan loop wrote within the last "
        f"{HEALTHY_MAX_AGE_S} seconds; 503 when it has not (`stale`) or "
        "the database has no scans yet (`no-scans`). Safe for boot checks, "
        "uptime probes, and CI smoke."
    ),
)
def healthz(db: Session = Depends(get_db)):
    latest = db.query(func.max(MachineState.timestamp)).scalar()
    if latest is None:
        return JSONResponse(
            status_code=503,
            content={"status": "no-scans", "seconds_since_last_scan": None},
        )
    age = (datetime.utcnow() - latest).total_seconds()
    if age > HEALTHY_MAX_AGE_S:
        return JSONResponse(
            status_code=503,
            content={"status": "stale", "seconds_since_last_scan": round(age, 1)},
        )
    return {
        "status": "ok",
        "version": app.version,
        "seconds_since_last_scan": round(age, 1),
    }

# Mount SPA last (catches all routes)
mount_spa(app, "static")

@app.get("/api", include_in_schema=False)
async def api_root():
    return {"message": "VPS Anatomy API", "version": "0.3.0", "docs": "/docs", "schema": "/openapi.json"}
