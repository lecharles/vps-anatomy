"""VPS scanner: collects machine facts, listening services, and module states.

Design rule: this file ships in a PUBLIC repo and contains only mechanism.
Host-specific facts live in gitignored local files:
  - backend/service_catalog.json  port -> [name, kind, description]
  - backend/host_modules.json     list of residents to probe
  - backend/service_configs.json  port -> [candidate config paths] (S13b)
When those files are absent the scanner still works: ports are labeled by
generic meaning, a minimal set of universal modules is probed, and config
citations fall back to the well-known distro paths below.
"""
import json
import os
import re
import shutil
import subprocess
from datetime import datetime

from sqlalchemy.orm import Session

from models import MachineState, ServiceState, ModuleState, Change, LatencySample
from database import SessionLocal
from core.retention import maybe_run as retention_maybe_run
from core import latency
import asyncio

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_json(name):
    try:
        with open(os.path.join(BACKEND_DIR, name)) as f:
            return json.load(f)
    except Exception:
        return None


# Generic port meanings (same on thousands of hosts; safe for the public repo)
SERVICE_CATALOG = {
    22: ("SSH", "system", "Remote administration."),
    53: ("DNS resolver", "system", "Local stub resolver."),
    80: ("HTTP", "web", "Unencrypted web traffic."),
    443: ("HTTPS", "web", "Encrypted web traffic."),
    3306: ("MySQL", "database", "Relational store."),
    5432: ("PostgreSQL", "database", "Relational store."),
    6379: ("Redis", "queue", "In-memory store / job queue."),
    8080: ("HTTP app", "web-app", "Alternate web server or dev server."),
    8765: ("HTTP app", "web-app", "Application server."),
    9090: ("Prometheus", "metrics", "Metrics endpoint."),
    11434: ("Ollama", "model-server", "Local model runtime."),
}
_local = _load_json("service_catalog.json")
if _local:
    SERVICE_CATALOG.update({int(k): tuple(v) for k, v in _local.items()})

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


# S13b — disk citations for port rows. These are the well-known paths a
# stock distro package writes for each service; the map is mechanism, not
# a host fact. A gitignored overlay (backend/service_configs.json, same
# shape as service_catalog.json) can add host-specific entries. Nothing
# here claims a path is real: config_citation() only returns a path after
# os.path.exists proves it on THIS disk, and a row with no surviving
# candidate is served as unattributed rather than guessed.
CONFIG_CANDIDATES: dict = {
    22: ["/etc/ssh/sshd_config"],
    53: ["/etc/systemd/resolved.conf", "/etc/resolv.conf"],
    80: ["/etc/nginx/nginx.conf", "/etc/caddy/Caddyfile", "/etc/apache2/apache2.conf"],
    443: ["/etc/nginx/nginx.conf", "/etc/caddy/Caddyfile", "/etc/apache2/apache2.conf"],
    3306: ["/etc/mysql/my.cnf", "/etc/my.cnf"],
    5432: ["/etc/postgresql"],
    6379: ["/etc/redis/redis.conf", "/etc/redis.conf"],
    9090: ["/etc/prometheus/prometheus.yml"],
    11434: ["~/.ollama"],
}
_local_cfg = _load_json("service_configs.json")
if _local_cfg:
    CONFIG_CANDIDATES.update({int(k): list(v) for k, v in _local_cfg.items()})


def config_citation(port: int):
    """First candidate config path for this port that actually exists.

    Existence-checked at read time, so the citation is a claim about the
    disk, not about the catalog. Returns None when nothing survives —
    honesty over coverage.
    """
    for cand in CONFIG_CANDIDATES.get(port, []):
        path = os.path.expanduser(cand)
        try:
            if os.path.exists(path):
                return path
        except OSError:
            continue
    return None


# Default residents probed when no local host_modules.json is present.
DEFAULT_MODULES = [
    {"module_id": "docker", "name": "Docker", "probe": {"pgrep": "dockerd"}},
    {"module_id": "ollama", "name": "Ollama", "probe": {"port": 11434}},
    {"module_id": "cron", "name": "Cron", "probe": {"pgrep": "cron"}},
]


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
    try:
        with open("/proc/uptime") as f:
            secs = float(f.read().split()[0])
        uptime_days = int(secs // 86400)
    except Exception:
        pass

    ip_public = None
    out = _probe(["curl", "-s", "--max-time", "4", "https://api.ipify.org"])
    if out and re.match(r"^\d+\.\d+\.\d+\.\d+$", out):
        ip_public = out
    else:
        ip_public = "unknown"

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
    return ("unattributed listener", "system", "Listener owned by another user — the scanner sees the port but not the process. This is permissions, not a bug.")


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
        # ss brackets IPv6 addresses ("[::]:443"). The public-bind check
        # and the routers both expect bare addresses, so unwrap here.
        if bind.startswith("[") and bind.endswith("]"):
            bind = bind[1:-1]
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
        out = subprocess.run(["pgrep", "-f", pattern], capture_output=True, text=True, timeout=5)
        return bool(out.stdout.strip())
    except Exception:
        return False


def _port_open(p: int) -> bool:
    try:
        out = _probe(["bash", "-c", f"(echo > /dev/tcp/127.0.0.1/{p}) 2>/dev/null && echo yes"])
        return out == "yes"
    except Exception:
        return False


def _docker_names() -> list:
    out = _probe(["docker", "ps", "--format", "{{.Names}}"])
    if not out:
        return []
    return [line.strip() for line in out.splitlines() if line.strip()]


def scan_modules() -> list:
    """Status of configured residents. Spec format (host_modules.json):
    [{"module_id": "...", "name": "...", "role": "...",
      "probe": {"pgrep": "pattern"} | {"port": N} | {"docker": "substr"}}]
    """
    specs = _load_json("host_modules.json") or DEFAULT_MODULES
    containers_cache = None

    def containers():
        nonlocal containers_cache
        if containers_cache is None:
            containers_cache = _docker_names()
        return containers_cache

    modules = []
    for spec in specs:
        probe = spec.get("probe", {})
        status = "stopped"
        data = {}
        if "pgrep" in probe:
            status = "live" if _pgrep_running(probe["pgrep"]) else "stopped"
        if "port" in probe:
            up = _port_open(int(probe["port"]))
            status = "live" if up else "stopped"
            if up:
                data["port"] = int(probe["port"])
        if "docker" in probe:
            matched = [c for c in containers() if probe["docker"] in c]
            status = "live" if matched else "stopped"
            if matched:
                data["containers"] = matched
        if spec.get("module_id") == "docker" and containers():
            data["containers"] = containers()
        if spec.get("role"):
            data["role"] = spec["role"]
        modules.append({
            "module_id": spec["module_id"],
            "name": spec["name"],
            "status": status,
            "data": data,
        })
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

    # Baseline = the app has recorded NO history at all. Checking both
    # tables matters: a host with zero TCP listeners still has module
    # history, and treating it as "first scan" would mute every module
    # event forever (caught by the S11b change-diff tests).
    baseline = latest_ts is None and latest_mod_ts is None

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

            # S14a — time the localhost hops this very scan found.
            # Connect-only probes run in a worker thread so the event
            # loop never waits on the kernel, and the scan records
            # whatever came back: a dead port is a stated gap, not a
            # failed scan.
            hops = await asyncio.to_thread(
                latency.probe_ports, [s["port"] for s in services_data])
            for h in hops:
                db.add(LatencySample(timestamp=now, **h))
            db.commit()
            db.close()
            print(f"[scanner] machine OK · {len(services_data)} services · {sum(1 for m in modules_data if m['status']=='live')} modules live", flush=True)
            # Once a day (first pass after startup always): archive hours,
            # prune raw snapshots past their window. Cheap and self-healing.
            rdb = SessionLocal()
            try:
                retention_maybe_run(rdb)
            finally:
                rdb.close()
        except Exception as e:
            print(f"Scanner error: {e}", flush=True)
        await asyncio.sleep(30)
