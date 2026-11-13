"""S14a — the measured localhost hops, served raw.

No smoothing, no rollups, no cached promises: /api/latency/ answers
with the probe block written by the newest scan that produced one.
`connect_ms` is the median loopback TCP handshake in milliseconds —
connect-only, as the module docstring in core/latency.py explains.
A null is a port that answered nothing across all probes, stated as
such by `ok: false`; it is never a silent zero.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import LatencySample
from schemas import LatencyReading as LatencyReadingSchema
from typing import List

router = APIRouter(prefix="/api/latency", tags=["latency"])


@router.get("/", response_model=List[LatencyReadingSchema],
            summary="Loopback hop latency, newest scan")
def get_latest_latency(db: Session = Depends(get_db)):
    """Median TCP-handshake ms per port from the newest probe block."""
    latest = db.query(LatencySample.timestamp) \
               .order_by(LatencySample.timestamp.desc()).first()
    if not latest:
        return []
    return db.query(LatencySample).filter(
        LatencySample.timestamp == latest[0]).order_by(LatencySample.port).all()


@router.get("/history", response_model=List[LatencyReadingSchema],
            summary="Hop latency history, optionally one port")
def get_latency_history(port: int = None, limit: int = 200,
                        db: Session = Depends(get_db)):
    """Recent probe blocks, newest first; narrow to one port with `port`."""
    query = db.query(LatencySample)
    if port is not None:
        query = query.filter(LatencySample.port == port)
    return query.order_by(LatencySample.timestamp.desc()) \
                .limit(min(max(limit, 1), 5000)).all()
