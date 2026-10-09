from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any

class MachineState(BaseModel):
    id: int
    timestamp: datetime
    hostname: str
    os: str
    arch: str
    cpus: int
    ram_gb: float
    disk_total_gb: float
    disk_used_gb: float
    uptime_days: int
    ip_public: str
    
    class Config:
        from_attributes = True

class ServiceState(BaseModel):
    id: int
    timestamp: datetime
    port: int
    bind: str
    name: str
    owner: str
    protocol: str
    public: bool
    status: str
    
    class Config:
        from_attributes = True

class ModuleState(BaseModel):
    id: int
    timestamp: datetime
    module_id: str
    name: str
    status: str
    data: Optional[dict] = None
    
    class Config:
        from_attributes = True

class Change(BaseModel):
    id: int
    timestamp: datetime
    change_type: str
    entity_type: str
    entity_id: str
    description: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    
    class Config:
        from_attributes = True
