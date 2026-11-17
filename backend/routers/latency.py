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

# S26 — synthetic block: three answered hops and one stated gap. The
# null `connect_ms` with ok=false is the contract in row form — a port
# that answered nothing reads as absent timing, never a fake zero.
EXAMPLE_ROWS = [
    {"timestamp": "2026-01-15T09:30:00.123456", "port": 22,
     "connect_ms": 0.18, "ok": True, "probes": 3, "hits": 3},
    {"timestamp": "2026-01-15T09:30:00.123456", "port": 8080,
     "connect_ms": 0.24, "ok": True, "probes": 3, "hits": 3},
    {"timestamp": "2026-01-15T09:30:00.123456", "port": 11434,
     "connect_ms": None, "ok": False, "probes": 3, "hits": 0},
]


@router.get("/", response_model=List[LatencyReadingSchema],
            summary="Loopback hop latency, newest scan",
            responses={200: {
                "description": (
                    "One row per listening port probed in the newest "
                    "scan that produced a block, ordered by port. "
                    "`connect_ms` is the median of `probes` loopback "
                    "handshakes; `ok: false` names a stated gap "
                    "(`hits` of `probes` answered), never a zero."
                ),
                "content": {"application/json": {"example": EXAMPLE_ROWS}},
            }},
)
def get_latest_latency(db: Session = Depends(get_db)):
    """Median TCP-handshake ms per port from the newest probe block."""
    latest = db.query(LatencySample.timestamp) \
               .order_by(LatencySample.timestamp.desc()).first()
    if not latest:
        return []
    return db.query(LatencySample).filter(
        LatencySample.timestamp == latest[0]).order_by(LatencySample.port).all()


@router.get("/history", response_model=List[LatencyReadingSchema],
            summary="Hop latency history, optionally one port",
            responses={200: {
                "description": (
                    "Recent probe blocks, newest first; pass `port` "
                    "for one hop's record. Rows are pruned past the "
                    "retention window like the other raw tables."
                ),
                "content": {"application/json": {"example": EXAMPLE_ROWS[:2]}},
            }},
)
def get_latency_history(port: int = None, limit: int = 200,
                        db: Session = Depends(get_db)):
    """Recent probe blocks, newest first; narrow to one port with `port`."""
    query = db.query(LatencySample)
    if port is not None:
        query = query.filter(LatencySample.port == port)
    return query.order_by(LatencySample.timestamp.desc()) \
                .limit(min(max(limit, 1), 5000)).all()
