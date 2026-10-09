from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ModuleState
from schemas import ModuleState as ModuleStateSchema
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
