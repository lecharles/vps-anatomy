from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from database import get_db
from models import ModuleState
from schemas import ModuleHour, ModuleState as ModuleStateSchema
from typing import List

router = APIRouter(prefix="/api/modules", tags=["modules"])

# S26 — synthetic residents: one live with its probe fact, one down.
EXAMPLE_ROWS = [
    {
        "id": 61102,
        "timestamp": "2026-01-15T09:30:00.123456",
        "module_id": "model-server",
        "name": "Model server",
        "status": "live",
        "data": {"port": 11434},
    },
    {
        "id": 61103,
        "timestamp": "2026-01-15T09:30:00.123456",
        "module_id": "scheduler",
        "name": "Scheduler service",
        "status": "stopped",
        "data": {},
    },
]

@router.get(
    "/",
    response_model=List[ModuleStateSchema],
    summary="All residents with live status",
    responses={200: {
        "description": (
            "One row per configured resident from the newest scan. "
            "`data` holds whatever cheap probe answered (port, "
            "container fragment); an empty object means the probe was "
            "a process-pattern check with nothing extra to report."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROWS}},
    }},
)
def get_latest_modules(db: Session = Depends(get_db)):
    """Get latest module states"""
    # Get latest timestamp
    latest = db.query(ModuleState.timestamp).order_by(ModuleState.timestamp.desc()).first()
    if not latest:
        return []
    
    return db.query(ModuleState).filter(ModuleState.timestamp == latest[0]).all()

@router.get(
    "/{module_id}",
    response_model=ModuleStateSchema,
    summary="One resident's latest state",
    responses={200: {
        "description": "The newest row for this resident.",
        "content": {"application/json": {"example": EXAMPLE_ROWS[0]}},
    }},
)
def get_module(module_id: str, db: Session = Depends(get_db)):
    """Get latest state for a specific module"""
    module = db.query(ModuleState).filter(
        ModuleState.module_id == module_id
    ).order_by(ModuleState.timestamp.desc()).first()
    return module

@router.get(
    "/{module_id}/history",
    response_model=List[ModuleStateSchema],
    summary="One resident's scan history",
    responses={200: {
        "description": (
            "The newest `limit` raw rows for this resident, newest "
            "first — one per 30s scan inside the retention window."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROWS}},
    }},
)
def get_module_history(module_id: str, limit: int = 100, db: Session = Depends(get_db)):
    """Get module state history"""
    return db.query(ModuleState).filter(
        ModuleState.module_id == module_id
    ).order_by(ModuleState.timestamp.desc()).limit(limit).all()


# SQLite hour bucket — same format and meaning as /api/trends, so the
# sparkline and the site-wide charts cut time the same way.
HOUR_FMT = "%Y-%m-%dT%H:00:00Z"


@router.get(
    "/{module_id}/sparkline",
    response_model=List[ModuleHour],
    summary="One resident's hourly liveness record",
    responses={200: {
        "description": (
            "One point per recorded UTC hour, oldest first. The middle "
            "hour of the example spent a third of its probes down — a "
            "visible dip in the sparkline, not a hidden average."
        ),
        "content": {"application/json": {"example": [
            {"hour": "2026-01-15T08:00:00Z", "scans": 119, "live": 119},
            {"hour": "2026-01-15T09:00:00Z", "scans": 120, "live": 80},
            {"hour": "2026-01-15T10:00:00Z", "scans": 42, "live": 42},
        ]}},
    }},
)
def get_module_sparkline(
    module_id: str,
    hours: int = Query(
        24,
        ge=1,
        le=720,
        description="Trailing UTC hours to bucket. day = 24, week = 168, month = 720.",
    ),
    db: Session = Depends(get_db),
):
    """Hourly live-share for one resident — S24, the data behind the
    module-detail mini-sparkline.

    One row per UTC hour the scanner probed this resident, oldest first.
    `scans` counts the probes that hour (the cadence is 30 s, so a full
    hour is ~120); `live` counts the probes that found the resident
    live. `live / scans` is therefore the share of the hour spent
    alive: 1.0 is a resident that never blinked, 0.5 is one that spent
    half the hour down. Hours with no probes are absent from the list —
    a gap in the record, never a fake zero.
    """
    since = datetime.utcnow() - timedelta(hours=hours)
    rows = (
        db.query(
            func.strftime(HOUR_FMT, ModuleState.timestamp).label("hour"),
            func.count(ModuleState.id).label("scans"),
            func.sum(
                case((ModuleState.status == "live", 1), else_=0)
            ).label("live"),
        )
        .filter(ModuleState.module_id == module_id)
        .filter(ModuleState.timestamp >= since)
        .group_by("hour")
        .order_by("hour")
        .all()
    )
    return [
        {"hour": hour, "scans": int(scans or 0), "live": int(live or 0)}
        for hour, scans, live in rows
    ]
