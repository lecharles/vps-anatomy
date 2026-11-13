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
    # S13b: a config path proven to exist on this disk at read time,
    # or None — the row is then served as unattributed, never guessed.
    config: Optional[str] = None
    
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

class HourlyTrend(BaseModel):
    hour: str
    scans: int
    # null = metric not requested via the `metrics` param; absent hour =
    # the scanner recorded nothing then.
    services_listening: Optional[int] = None
    modules_live: Optional[int] = None
    ram_gb_avg: Optional[float] = None
    disk_used_gb_avg: Optional[float] = None

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
