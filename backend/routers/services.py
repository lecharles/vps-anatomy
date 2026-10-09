from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ServiceState
from schemas import ServiceState as ServiceStateSchema
from typing import List

router = APIRouter(prefix="/api/services", tags=["services"])

@router.get("/", response_model=List[ServiceStateSchema])
def get_latest_services(db: Session = Depends(get_db)):
    """Get latest service states"""
    # Get latest timestamp
    latest = db.query(ServiceState.timestamp).order_by(ServiceState.timestamp.desc()).first()
    if not latest:
        return []
    
    return db.query(ServiceState).filter(ServiceState.timestamp == latest[0]).all()

@router.get("/history", response_model=List[ServiceStateSchema])
def get_service_history(port: int = None, limit: int = 100, db: Session = Depends(get_db)):
    """Get service state history"""
    query = db.query(ServiceState)
    if port:
        query = query.filter(ServiceState.port == port)
    return query.order_by(ServiceState.timestamp.desc()).limit(limit).all()
