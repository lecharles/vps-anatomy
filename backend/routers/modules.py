from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from database import get_db
from models import ModuleState
from schemas import ModuleHour, ModuleState as ModuleStateSchema
from typing import List

router = APIRouter(prefix="/api/modules", tags=["modules"])

@router.get("/", response_model=List[ModuleStateSchema], summary="All residents with live status")
def get_latest_modules(db: Session = Depends(get_db)):
    """Get latest module states"""
    # Get latest timestamp
    latest = db.query(ModuleState.timestamp).order_by(ModuleState.timestamp.desc()).first()
    if not latest:
        return []
    
    return db.query(ModuleState).filter(ModuleState.timestamp == latest[0]).all()

@router.get("/{module_id}", response_model=ModuleStateSchema, summary="One resident's latest state")
def get_module(module_id: str, db: Session = Depends(get_db)):
    """Get latest state for a specific module"""
    module = db.query(ModuleState).filter(
        ModuleState.module_id == module_id
    ).order_by(ModuleState.timestamp.desc()).first()
    return module

@router.get("/{module_id}/history", response_model=List[ModuleStateSchema], summary="One resident's scan history")
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
