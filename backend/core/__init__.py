import subprocess
import json
import re
from datetime import datetime
from sqlalchemy.orm import Session
from models import MachineState, ServiceState, ModuleState, Change
from database import SessionLocal
import asyncio

def scan_machine() -> dict:
    """Scan machine facts"""
    try:
        hostname = subprocess.check_output(['hostname'], text=True).strip()
        os_info = subprocess.check_output(['uname', '-s'], text=True).strip()
        arch = subprocess.check_output(['uname', '-m'], text=True).strip()
        cpus = int(subprocess.check_output(['nproc'], text=True).strip())
        
        # RAM
        ram_output = subprocess.check_output(['free', '-g'], text=True)
        ram_gb = float(re.search(r'Mem:\s+(\d+)', ram_output).group(1))
        
        # Disk
        disk_output = subprocess.check_output(['df', '-BG', '/'], text=True)
        disk_match = re.search(r'/dev/\S+\s+(\d+)G\s+(\d+)G', disk_output)
        disk_total = float(disk_match.group(1)) if disk_match else 0
        disk_used = float(disk_match.group(2)) if disk_match else 0
        
        # Uptime
        uptime_output = subprocess.check_output(['uptime', '-d'], text=True)
        uptime_days = int(re.search(r'up\s+(\d+)\s+day', uptime_output).group(1))
        
        # Public IP
        try:
            ip_public = subprocess.check_output(['curl', '-s', 'ifconfig.me'], text=True, timeout=5).strip()
        except:
            ip_public = "unknown"
        
        return {
            "hostname": hostname,
            "os": os_info,
            "arch": arch,
            "cpus": cpus,
            "ram_gb": ram_gb,
            "disk_total_gb": disk_total,
            "disk_used_gb": disk_used,
            "uptime_days": uptime_days,
            "ip_public": ip_public
        }
    except Exception as e:
        return {"error": str(e)}

def scan_services() -> list:
    """Scan listening services"""
    try:
        output = subprocess.check_output(['ss', '-tlnp'], text=True)
        services = []
        for line in output.strip().split('\n')[1:]:
            parts = line.split()
            if len(parts) >= 4:
                addr = parts[3]
                port_match = re.search(r':(\d+)$', addr)
                if port_match:
                    port = int(port_match.group(1))
                    bind = addr.replace(f':{port}', '')
                    
                    # Extract process name
                    name = "unknown"
                    if len(parts) >= 6:
                        proc_match = re.search(r'users:\(\("([^"]+)"', parts[5])
                        if proc_match:
                            name = proc_match.group(1)
                    
                    services.append({
                        "port": port,
                        "bind": bind,
                        "name": name,
                        "owner": "unknown",
                        "protocol": "tcp",
                        "public": bind in ['0.0.0.0', '::', '*'],
                        "status": "running"
                    })
        return services
    except Exception as e:
        return []

def scan_modules() -> list:
    """Scan known modules"""
    modules = []
    
    # Hermes
    try:
        hermes_running = len(subprocess.check_output(['pgrep', '-f', 'hermes'], text=True).strip()) > 0
        modules.append({
            "module_id": "hermes",
            "name": "Hermes (Rook)",
            "status": "live" if hermes_running else "stopped",
            "data": {"process": "hermes-gateway" if hermes_running else None}
        })
    except:
        modules.append({"module_id": "hermes", "name": "Hermes (Rook)", "status": "stopped", "data": {}})
    
    # OpenClaw
    try:
        openclaw_running = len(subprocess.check_output(['pgrep', '-f', 'openclaw'], text=True).strip()) > 0
        modules.append({
            "module_id": "openclaw",
            "name": "OpenClaw (Philip)",
            "status": "live" if openclaw_running else "stopped",
            "data": {"process": "openclaw-gateway" if openclaw_running else None}
        })
    except:
        modules.append({"module_id": "openclaw", "name": "OpenClaw (Philip)", "status": "stopped", "data": {}})
    
    # Ollama
    try:
        ollama_running = len(subprocess.check_output(['pgrep', '-f', 'ollama'], text=True).strip()) > 0
        modules.append({
            "module_id": "ollama",
            "name": "Ollama",
            "status": "live" if ollama_running else "stopped",
            "data": {"port": 11434 if ollama_running else None}
        })
    except:
        modules.append({"module_id": "ollama", "name": "Ollama", "status": "stopped", "data": {}})
    
    return modules

def detect_changes(db: Session, new_machine: dict, new_services: list, new_modules: list):
    """Detect changes and record them"""
    # Get previous state
    prev_machine = db.query(MachineState).order_by(MachineState.timestamp.desc()).first()
    prev_services = db.query(ServiceState).filter(
        ServiceState.timestamp == db.query(ServiceState.timestamp).order_by(ServiceState.timestamp.desc()).first().timestamp
    ).all() if db.query(ServiceState).count() > 0 else []
    
    # Detect service changes
    prev_ports = {s.port: s for s in prev_services}
    new_ports = {s['port']: s for s in new_services}
    
    # New services
    for port, svc in new_ports.items():
        if port not in prev_ports:
            change = Change(
                change_type="service_started",
                entity_type="service",
                entity_id=f"port_{port}",
                description=f"Service started on port {port} ({svc['name']})",
                new_value=svc
            )
            db.add(change)
    
    # Stopped services
    for port, svc in prev_ports.items():
        if port not in new_ports:
            change = Change(
                change_type="service_stopped",
                entity_type="service",
                entity_id=f"port_{port}",
                description=f"Service stopped on port {port} ({svc.name})",
                old_value={"port": port, "name": svc.name}
            )
            db.add(change)
    
    db.commit()

async def scan_loop():
    """Background task: scan VPS every 30 seconds"""
    while True:
        try:
            db = SessionLocal()
            
            # Scan
            machine_data = scan_machine()
            services_data = scan_services()
            modules_data = scan_modules()
            
            # Store machine state
            machine_state = MachineState(**machine_data)
            db.add(machine_state)
            
            # Store services
            for svc in services_data:
                service_state = ServiceState(**svc)
                db.add(service_state)
            
            # Store modules
            for mod in modules_data:
                module_state = ModuleState(**mod)
                db.add(module_state)
            
            # Detect changes
            detect_changes(db, machine_data, services_data, modules_data)
            
            db.commit()
            db.close()
            
        except Exception as e:
            print(f"Scanner error: {e}")
        
        await asyncio.sleep(30)
