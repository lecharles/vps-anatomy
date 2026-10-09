"""VPS scanner: collects machine facts, listening services, and module states.

Rewritten 2026-10-09 to be robust:
  * Native /proc and Python APIs instead of parsing shell tools that vary
    between systems (uptime -d does not exist on this host; free/df regexes
    broke on wrapped output).
  * Every fact has a safe default; a single failing probe never poisons the
    whole scan (the old scanner returned {"error": ...} which crashed
    MachineState(**data) and left the DB permanently empty).
  * Service catalog labels known ports the way the VPS dashboard does, so the
    UI can show what each listener actually IS, not just a bare number.
  * Change detection handles the empty-DB baseline and tracks module
    live/stopped transitions.
"""
import json
import os
import re
import shutil
import subprocess
from datetime import datetime

from sqlalchemy.orm import Session

from models import MachineState, ServiceState, ModuleState, Change
from database import SessionLocal
import asyncio

# ---------------------------------------------------------------------------
# Facts about this specific machine (stable identifiers, used as fallbacks
# only if a live probe fails).
# ---------------------------------------------------------------------------
FALLBACK_PUBLIC_IP = "0.0.0.0"

# Known listeners: port -> (name, kind, description). Mirrors the language of
# the port-88 VPS dashboard so both apps tell the same story.
SERVICE_CATALOG = {
    8080: ("Mini-site server", "static-http", "Serves dashboard and mini-site HTML pages to your browser."),
    8090: ("web-app", "web-app", "Coding lane 1 — fine-tuner & agent tester web app."),
    8091: ("research-app", "web-app", "Coding lane 2 — research signal dashboard."),
    8093: ("VPS Anatomy", "web-app", "This app: the educational reader for the live machine."),
    8765: ("datasets data", "static-http", "Serves collected datasets datasets to nodes and dashboards."),
    11434: ("Ollama", "model-server", "Local model runtime for embeddings and small models."),
    5432: ("PostgreSQL", "database", "Relational store (Temporal / Postiz backends)."),
    6379: ("Redis", "queue", "In-flight job queue for Postiz posting."),
    8081: ("Temporal UI", "ui", "Browser console for inspecting workflow runs."),
    7233: ("Temporal", "workflow-engine", "Durable workflow engine with retries and state."),
    9200: ("Elasticsearch", "index", "Search index powering workflow listing."),
    3000: ("Next.js dev", "web-app", "A Next.js app in development."),
    9090: ("Prometheus", "metrics", "Metrics endpoint."),
    8000: ("agent-api", "agent-api", "Primary agent API (Hermes)."),
    8010: ("lane-instance", "agent-api", "Isolated test instance of the Hermes app."),
    8020: ("lane-instance", "agent-api", "Isolated test instance of the Hermes app."),
    8040: ("Lane server", "agent-api", "Additional lane instance."),
    18789: ("agent-gateway", "agent-gateway", "Second agent (OpenClaw) control gateway."),
    18791: ("agent-browser", "agent-browser", "Browser-control endpoint for OpenClaw."),
    22: ("SSH", "system", "Remote administration. The door the whole machine hangs on."),
    53: ("systemd-resolved", "system", "Local DNS stub resolver."),
    631: ("CUPS", "system", "Printing service — present on every stock Ubuntu."),
    3080: ("desk-app Desktop", "web-app", "desk-app OS desktop app served through nginx."),
    4007: ("Postiz", "web-app", "Social scheduler UI (register/login behind /auth)."),
    8788: ("mail-api API", "api", "datasets/mail-api authenticated API (mail-api/2.0)."),
    9876: ("files-app", "static-http", "Small file server for private datasets."),
}

PROC_HINTS = {
    "node": "Node.js runtime",
    "python": "Python runtime",
    "uvicorn": "ASGI web server",
    "docker-proxy": "Docker port forward (containerized service)",
    "caddy": "Reverse proxy",
    "nginx": "Web server",
    "ollama": "Ollama model runtime",
    "postgres": "PostgreSQL",
    "redis-server": "Redis",
    "temporal": "Temporal server",
    "splitw": "Tmux session",
    "tmux": "Terminal multiplexer",
}


def _probe(cmd, timeout=5):
    """Run a command, return stdout or None. Never raises."""
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL, timeout=timeout).strip()
    except Exception:
        return None


def _os_release():
    try:
        with open("/etc/os-release") as f:
            for line in f:
                if line.startswith("PRETTY_NAME="):
                    return line.split("=", 1)[1].strip().strip('"')
    except Exception:
        pass
    return None


def scan_machine() -> dict:
    """Collect machine facts natively; each field independently falls back."""
    uname = os.uname()
    hostname = uname.nodename or "unknown"

    os_name = _os_release() or f"{uname.sysname} {uname.release}"
    arch = uname.machine

    try:
        cpus = os.cpu_count() or 0
    except Exception:
        cpus = 0

    # RAM from /proc/meminfo (KB), total
    ram_gb = 0.0
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    ram_gb = round(int(line.split()[1]) / 1024 / 1024, 1)
                    break
    except Exception:
        pass

    disk_total_gb = disk_used_gb = 0.0
    try:
        usage = shutil.disk_usage("/")
        disk_total_gb = round(usage.total / 1024 ** 3, 1)
        disk_used_gb = round(usage.used / 1024 ** 3, 1)
    except Exception:
        pass

    uptime_days = 0
    uptime_hours = 0.0
    try:
        with open("/proc/uptime") as f:
            secs = float(f.read().split()[0])
        uptime_days = int(secs // 86400)
        uptime_hours = round(secs / 3600, 1)
    except Exception:
        pass

    ip_public = None
    out = _probe(["curl", "-s", "--max-time", "4", "https://api.ipify.org"])
    if out and re.match(r"^\d+\.\d+\.\d+\.\d+$", out):
        ip_public = out
    else:
        ip_public = FALLBACK_PUBLIC_IP

    return {
        "hostname": hostname,
        "os": os_name,
        "arch": arch,
        "cpus": cpus,
        "ram_gb": ram_gb,
        "disk_total_gb": disk_total_gb,
        "disk_used_gb": disk_used_gb,
        "uptime_days": uptime_days,
        "ip_public": ip_public,
    }


def _label_service(port, proc_name):
    """Return (name, kind, description) for a listener using catalog + hints."""
    if port in SERVICE_CATALOG:
        return SERVICE_CATALOG[port]
    if proc_name in PROC_HINTS:
        return (proc_name, "process", PROC_HINTS[proc_name] + ".")
    return ("unattributed listener", "system", "Listener owned by another user (root) — the scanner sees the port but not the process. This is permissions, not a bug.")


def scan_services() -> list:
    """Parse `ss -tlnp` defensively; the users field position varies."""
    out = _probe(["ss", "-tlnp"])
    if not out:
        return []
    services, seen = [], set()
    for line in out.splitlines()[1:]:
        cols = line.split()
        if len(cols) < 4:
            continue
        addr = cols[3]
        m = re.search(r":(\d+)$", addr)
        if not m:
            continue
        port = int(m.group(1))
        bind = addr[: addr.rfind(":")] or "*"
        # process name: search the whole line, not a fixed column
        proc = None
        pm = re.search(r'users:\(\("([^"]+)"', line)
        if pm:
            proc = pm.group(1)
        if port in seen:
            continue
        seen.add(port)
        name, kind, desc = _label_service(port, proc)
        services.append({
            "port": port,
            "bind": bind,
            "name": name,
            "owner": proc or "unknown",
            "protocol": "tcp",
            "public": bind in ("0.0.0.0", "::", "*"),
            "status": "running",
        })
    return services


def _pgrep_running(pattern: str) -> bool:
    try:
        out = subprocess.run(
            ["pgrep", "-f", pattern], capture_output=True, text=True, timeout=5
        )
        return bool(out.stdout.strip())
    except Exception:
        return False


def _docker_names() -> list:
    out = _probe(["docker", "ps", "--format", "{{.Names}}\t{{.Status}}"])
    if not out:
        return []
    return [line.split("\t")[0] for line in out.splitlines() if line.strip()]


def scan_modules() -> list:
    """Status of the known residents of this machine."""
    docker_running = _pgrep_running("dockerd")
    containers = _docker_names() if docker_running else []

    def port_open(p):
        out = _probe(["bash", "-c", f"(echo > /dev/tcp/127.0.0.1/{p}) 2>/dev/null && echo yes"])
        return out == "yes"

    modules = [
        {
            "module_id": "hermes",
            "name": "Hermes (Rook)",
            "status": "live" if _pgrep_running("hermes") else "stopped",
            "data": {"role": "primary agent", "gateway": port_open(8000)},
        },
        {
            "module_id": "openclaw",
            "name": "OpenClaw (Philip)",
            "status": "live" if _pgrep_running("openclaw") else "stopped",
            "data": {"role": "second agent"},
        },
        {
            "module_id": "opencode",
            "name": "OpenCode",
            "status": "live" if _pgrep_running("opencode") else "stopped",
            "data": {"role": "shared coding engine"},
        },
        {
            "module_id": "ollama",
            "name": "Ollama",
            "status": "live" if port_open(11434) else "stopped",
            "data": {"port": 11434 if port_open(11434) else None},
        },
        {
            "module_id": "docker",
            "name": "Docker",
            "status": "live" if docker_running else "stopped",
            "data": {"containers": containers},
        },
        {
            "module_id": "temporal",
            "name": "Temporal",
            "status": "live" if any("temporal" in c for c in containers) else "stopped",
            "data": {"containers": [c for c in containers if "temporal" in c]},
        },
        {
            "module_id": "postiz",
            "name": "Postiz",
            "status": "live" if any("postiz" in c for c in containers) else "stopped",
            "data": {"containers": [c for c in containers if "postiz" in c]},
        },
        {
            "module_id": "minisite",
            "name": "Mini-site server",
            "status": "live" if port_open(8080) else "stopped",
            "data": {"port": 8080},
        },
        {
            "module_id": "cron",
            "name": "Cron",
            "status": "live" if _pgrep_running("cron") else "stopped",
            "data": {"role": "scheduler"},
        },
    ]
    return modules


def detect_changes(db: Session, machine: dict, services: list, modules: list):
    """Diff this scan against the previous one and record what moved.

    First-ever scan is a baseline: it records nothing so a restart does not
    flood the feed with 'service started' noise.
    """
    prev_services_rows = []
    latest_ts = db.query(ServiceState.timestamp).order_by(ServiceState.timestamp.desc()).first()
    if latest_ts is not None:
        prev_services_rows = db.query(ServiceState).filter(ServiceState.timestamp == latest_ts[0]).all()

    prev_modules_rows = []
    latest_mod_ts = db.query(ModuleState.timestamp).order_by(ModuleState.timestamp.desc()).first()
    if latest_mod_ts is not None:
        prev_modules_rows = db.query(ModuleState).filter(ModuleState.timestamp == latest_mod_ts[0]).all()

    baseline = latest_ts is None

    prev_ports = {s.port: s for s in prev_services_rows}
    new_ports = {s["port"]: s for s in services}

    if not baseline:
        for port, svc in new_ports.items():
            if port not in prev_ports:
                db.add(Change(
                    change_type="service_started", entity_type="service",
                    entity_id=f"port_{port}",
                    description=f"{svc['name']} started on port {port}",
                    new_value=svc,
                ))
        for port, svc in prev_ports.items():
            if port not in new_ports:
                db.add(Change(
                    change_type="service_stopped", entity_type="service",
                    entity_id=f"port_{port}",
                    description=f"{svc.name} stopped (port {port} no longer listening)",
                    old_value={"port": port, "name": svc.name},
                ))

    prev_modules = {m.module_id: m for m in prev_modules_rows}
    for mod in modules:
        prev = prev_modules.get(mod["module_id"])
        if prev is not None and not baseline and prev.status != mod["status"]:
            kind = "module_started" if mod["status"] == "live" else "module_stopped"
            db.add(Change(
                change_type=kind, entity_type="module",
                entity_id=mod["module_id"],
                description=f"{mod['name']} is now {mod['status']}",
                old_value={"status": prev.status},
                new_value={"status": mod["status"]},
            ))

    db.commit()


async def scan_loop():
    """Background task: scan the VPS every 30 seconds."""
    while True:
        try:
            db = SessionLocal()
            machine_data = scan_machine()
            services_data = scan_services()
            modules_data = scan_modules()

            # Diff against the PREVIOUS commit first, then store this scan.
            detect_changes(db, machine_data, services_data, modules_data)
            # One shared timestamp per scan: the routers group by timestamp.
            now = datetime.utcnow()
            db.add(MachineState(timestamp=now, **machine_data))
            for svc in services_data:
                db.add(ServiceState(timestamp=now, **svc))
            for mod in modules_data:
                db.add(ModuleState(timestamp=now, **mod))
            db.commit()
            db.close()
            print(f"[scanner] machine OK · {len(services_data)} services · {sum(1 for m in modules_data if m['status']=='live')} modules live", flush=True)
        except Exception as e:
            print(f"Scanner error: {e}", flush=True)
        await asyncio.sleep(30)
