from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ServiceState
from schemas import ServiceState as ServiceStateSchema
from core import config_citation
from typing import List

router = APIRouter(prefix="/api/services", tags=["services"])

@router.get("/", response_model=List[ServiceStateSchema], summary="Services listening right now")
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

@router.get("/history", response_model=List[ServiceStateSchema], summary="Listener history, optionally one port")
def get_service_history(port: int = None, limit: int = 100, db: Session = Depends(get_db)):
    """Get service state history"""
    query = db.query(ServiceState)
    if port:
        query = query.filter(ServiceState.port == port)
    return query.order_by(ServiceState.timestamp.desc()).limit(limit).all()
