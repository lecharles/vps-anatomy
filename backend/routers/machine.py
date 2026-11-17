from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import MachineState
from schemas import MachineState as MachineStateSchema
from typing import List

router = APIRouter(prefix="/api/machine", tags=["machine"])

# S26 — synthetic example for the schema reference at /docs. Shape only:
# no fact here is read from the serving host (an example that mirrored
# live data would defeat the whole point of this file being public).
EXAMPLE_ROW = {
    "id": 10263,
    "timestamp": "2026-01-15T09:30:00.123456",
    "hostname": "anatomy-demo",
    "os": "Ubuntu 24.04 LTS",
    "arch": "x86_64",
    "cpus": 4,
    "ram_gb": 7.7,
    "disk_total_gb": 40.0,
    "disk_used_gb": 21.3,
    "uptime_days": 57,
    "ip_public": "unknown",
}

@router.get(
    "/",
    response_model=MachineStateSchema,
    summary="Current machine facts",
    responses={200: {
        "description": (
            "The newest scan row. Before the first scan completes the "
            "shape is the same and every fact reads 'unknown' or 0 — "
            "never a cached guess."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROW}},
    }},
)
def get_latest_machine(db: Session = Depends(get_db)):
    """Get latest machine state"""
    machine = db.query(MachineState).order_by(MachineState.timestamp.desc()).first()
    if not machine:
        return {
            "id": 0,
            "timestamp": "2026-01-01T00:00:00",
            "hostname": "unknown",
            "os": "unknown",
            "arch": "unknown",
            "cpus": 0,
            "ram_gb": 0,
            "disk_total_gb": 0,
            "disk_used_gb": 0,
            "uptime_days": 0,
            "ip_public": "unknown"
        }
    return machine

@router.get(
    "/history",
    response_model=List[MachineStateSchema],
    summary="Scan history of machine facts",
    responses={200: {
        "description": (
            "The newest `limit` scan rows, newest first — each row has "
            "the shape of the example above, one per 30s scan."
        ),
        "content": {"application/json": {"example": [EXAMPLE_ROW]}},
    }},
)
def get_machine_history(limit: int = 100, db: Session = Depends(get_db)):
    """Get machine state history"""
    return db.query(MachineState).order_by(MachineState.timestamp.desc()).limit(limit).all()
