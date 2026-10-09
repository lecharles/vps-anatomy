from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from datetime import datetime
from database import Base

class MachineState(Base):
    __tablename__ = "machine_states"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    hostname = Column(String)
    os = Column(String)
    arch = Column(String)
    cpus = Column(Integer)
    ram_gb = Column(Float)
    disk_total_gb = Column(Float)
    disk_used_gb = Column(Float)
    uptime_days = Column(Integer)
    ip_public = Column(String)

class ServiceState(Base):
    __tablename__ = "service_states"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    port = Column(Integer)
    bind = Column(String)
    name = Column(String)
    owner = Column(String)
    protocol = Column(String)
    public = Column(Boolean)
    status = Column(String)  # "running", "stopped", "new", "gone"

class ModuleState(Base):
    __tablename__ = "module_states"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    module_id = Column(String, index=True)
    name = Column(String)
    status = Column(String)
    data = Column(JSON)

class Change(Base):
    __tablename__ = "changes"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    change_type = Column(String)  # "service_started", "service_stopped", "module_updated", etc.
    entity_type = Column(String)  # "service", "module", "machine"
    entity_id = Column(String)
    description = Column(String)
    old_value = Column(JSON)
    new_value = Column(JSON)
