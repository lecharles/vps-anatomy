from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Change
from schemas import Change as ChangeSchema
from typing import List

router = APIRouter(prefix="/api/changes", tags=["changes"])

# S26 — synthetic events, one per detected kind. entity_id is a port
# label for service events and a module id for resident events —
# exactly the two axes the Changes feed filters on (S16a).
EXAMPLE_ROWS = [
    {
        "id": 8891,
        "timestamp": "2026-01-15T09:29:30.123456",
        "change_type": "service_started",
        "entity_type": "service",
        "entity_id": "port_22",
        "description": "SSH started on port 22",
        "old_value": None,
        "new_value": {
            "port": 22,
            "bind": "0.0.0.0",
            "name": "SSH",
            "owner": "sshd",
            "protocol": "tcp",
            "public": True,
        },
    },
    {
        "id": 8890,
        "timestamp": "2026-01-14T22:03:00.123456",
        "change_type": "module_stopped",
        "entity_type": "module",
        "entity_id": "model-server",
        "description": "Model server is now stopped",
        "old_value": {"status": "live"},
        "new_value": {"status": "stopped"},
    },
]

@router.get(
    "/",
    response_model=List[ChangeSchema],
    summary="Recent detected changes",
    responses={200: {
        "description": (
            "The newest `limit` events, newest first. The log holds "
            "only diffs between successive scans — a service and "
            "module that never change produce no rows. The first scan "
            "on an empty database seeds a baseline instead of "
            "flooding the log with 'started' events."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROWS}},
    }},
)
def get_changes(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent changes"""
    return db.query(Change).order_by(Change.timestamp.desc()).limit(limit).all()

@router.get(
    "/by-type/{change_type}",
    response_model=List[ChangeSchema],
    summary="Changes filtered by event type",
    responses={200: {
        "description": (
            "Same rows as the feed, narrowed to one change_type. An "
            "unknown type is not an error — it is an honest empty "
            "list."
        ),
        "content": {"application/json": {"example": EXAMPLE_ROWS[:1]}},
    }},
)
def get_changes_by_type(change_type: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get changes by type"""
    return db.query(Change).filter(
        Change.change_type == change_type
    ).order_by(Change.timestamp.desc()).limit(limit).all()
