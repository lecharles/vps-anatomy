from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import MachineState
from schemas import MachineState as MachineStateSchema
from typing import List

router = APIRouter(prefix="/api/machine", tags=["machine"])

@router.get("/", response_model=MachineStateSchema)
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

@router.get("/history", response_model=List[MachineStateSchema])
def get_machine_history(limit: int = 100, db: Session = Depends(get_db)):
    """Get machine state history"""
    return db.query(MachineState).order_by(MachineState.timestamp.desc()).limit(limit).all()
