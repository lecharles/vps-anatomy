from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from datetime import datetime
from database import Base


class TrendHour(Base):
    """Archived hourly rollup — survives raw-row pruning (core/retention.py).

    Keyed by the UTC hour string ("YYYY-MM-DDTHH:00:00Z"), the same bucket
    format /api/trends answers with. All metrics are stored; the `metrics`
    param filters at read time, not in the archive.
    """
    __tablename__ = "trend_hours"

    hour = Column(String, primary_key=True)
    scans = Column(Integer, nullable=False, default=0)
    services_listening = Column(Integer)
    modules_live = Column(Integer)
    ram_gb_avg = Column(Float)
    disk_used_gb_avg = Column(Float)
    computed_at = Column(DateTime, default=datetime.utcnow)


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


class LatencySample(Base):
    """S14a — one loopback handshake timing per (scan, port).

    connect_ms is the median of the probes that completed; None with
    ok = False is the honest 'nothing answered' — never a fake zero.
    """
    __tablename__ = "latency_samples"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    port = Column(Integer, index=True)
    connect_ms = Column(Float)
    ok = Column(Boolean, default=False)
    probes = Column(Integer, default=0)
    hits = Column(Integer, default=0)
