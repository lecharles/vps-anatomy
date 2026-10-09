from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Change
from schemas import Change as ChangeSchema
from typing import List

router = APIRouter(prefix="/api/changes", tags=["changes"])

@router.get("/", response_model=List[ChangeSchema])
def get_changes(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent changes"""
    return db.query(Change).order_by(Change.timestamp.desc()).limit(limit).all()

@router.get("/by-type/{change_type}", response_model=List[ChangeSchema])
def get_changes_by_type(change_type: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get changes by type"""
    return db.query(Change).filter(
        Change.change_type == change_type
    ).order_by(Change.timestamp.desc()).limit(limit).all()
