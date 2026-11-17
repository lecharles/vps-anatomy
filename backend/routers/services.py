from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ServiceState
from schemas import ServiceState as ServiceStateSchema
from core import config_citation
from typing import List

router = APIRouter(prefix="/api/services", tags=["services"])

# S26 — synthetic example: two textbook listeners, one public and one
# loopback-only. The config path is the stock distro location that
# config_citation() checks — present in the example, proven at runtime.
EXAMPLE_ROWS = [
    {
        "id": 40271,
        "timestamp": "2026-01-15T09:30:00.123456",
        "port": 22,
        "bind": "0.0.0.0",
        "name": "SSH",
        "owner": "sshd",
        "protocol": "tcp",
        "public": True,
        "status": "running",
        "config": "/etc/ssh/sshd_config",
    },
    {
        "id": 40272,
        "timestamp": "2026-01-15T09:30:00.123456",
        "port": 8080,
        "bind": "127.0.0.1",
        "name": "HTTP app",
        "owner": "uvicorn",
        "protocol": "tcp",
        "public": False,
        "status": "running",
        "config": None,
    },
]

@router.get(
    "/",
    response_model=List[ServiceStateSchema],
    summary="Services listening right now",
    responses={200: {
        "description": (
            "Every TCP listener from the newest scan. `config` is the "
            "S13b citation: a path proven to exist on this disk at "
            "read time, or null — the row is then served unattributed, "
            "never guessed."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROWS}},
    }},
)
def get_latest_services(db: Session = Depends(get_db)):
    """Get latest service states, each citing its source (S13b).

    The `config` field is resolved live per request: a candidate path
    for the port is cited only if it exists on this disk right now.
    A port row with no surviving candidate ships `config: null` and
    the UI says so plainly — an honest gap beats a guessed path.
    """
    # Get latest timestamp
    latest = db.query(ServiceState.timestamp).order_by(ServiceState.timestamp.desc()).first()
    if not latest:
        return []

    rows = db.query(ServiceState).filter(ServiceState.timestamp == latest[0]).all()
    out = []
    for r in rows:
        d = ServiceStateSchema.model_validate(r).model_dump()
        d["config"] = config_citation(r.port)
        out.append(d)
    return out

@router.get(
    "/history",
    response_model=List[ServiceStateSchema],
    summary="Listener history, optionally one port",
    responses={200: {
        "description": (
            "The newest `limit` listener rows, newest first; pass "
            "`port` to see one port's whole record. History rows carry "
            "no config citation — that is resolved live per request on "
            "the current-state endpoint only."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROWS[:1]}},
    }},
)
def get_service_history(port: int = None, limit: int = 100, db: Session = Depends(get_db)):
    """Get service state history"""
    query = db.query(ServiceState)
    if port:
        query = query.filter(ServiceState.port == port)
    return query.order_by(ServiceState.timestamp.desc()).limit(limit).all()
