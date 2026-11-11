"""S11b — change-diff tests for detect_changes().

The diff engine turns successive scans into the event log behind the
Changes feed. Its whole job is saying too little, never too much:
no baseline noise, no repeat events on an idle host, no fabricated
module starts for freshly added config rows.
"""
from datetime import datetime, timedelta

from models import Change, ModuleState, ServiceState
from core import detect_changes


def svc(port, name="listener"):
    return {"port": port, "bind": "0.0.0.0", "name": name, "owner": "pid",
            "protocol": "tcp", "public": True, "status": "running"}


def mod(module_id, status, name=None):
    return {"module_id": module_id, "name": name or module_id.title(),
            "status": status, "data": {}}


def seed_scan(db, ts, services, modules):
    """Write what a completed scan would have stored at time ts."""
    for s in services:
        db.add(ServiceState(timestamp=ts, **s))
    for m in modules:
        db.add(ModuleState(timestamp=ts, **m))
    db.commit()


def events(db):
    return [
        (c.change_type, c.entity_id)
        for c in db.query(Change).order_by(Change.id).all()
    ]


def test_first_scan_is_a_silent_baseline(db):
    detect_changes(db, {}, [svc(22, "SSH")], [mod("docker", "live")])
    assert events(db) == []


def test_identical_successive_scans_record_nothing(db):
    services = [svc(22, "SSH"), svc(80, "HTTP")]
    modules = [mod("docker", "live")]
    seed_scan(db, datetime.utcnow(), services, modules)
    detect_changes(db, {}, services, modules)
    assert events(db) == []


def test_new_port_emits_service_started(db):
    seed_scan(db, datetime.utcnow(), [svc(22, "SSH")], [])
    detect_changes(db, {}, [svc(22, "SSH"), svc(80, "HTTP")], [])
    assert events(db) == [("service_started", "port_80")]


def test_gone_port_emits_service_stopped(db):
    seed_scan(db, datetime.utcnow(), [svc(22, "SSH"), svc(80, "HTTP")], [])
    detect_changes(db, {}, [svc(22, "SSH")], [])
    assert events(db) == [("service_stopped", "port_80")]


def test_change_rows_carry_their_side_values(db):
    t0 = datetime.utcnow()
    seed_scan(db, t0, [svc(22, "SSH")], [])
    detect_changes(db, {}, [], [])
    (row,) = db.query(Change).all()
    assert row.entity_type == "service"
    assert row.old_value == {"port": 22, "name": "SSH"}
    assert "no longer listening" in row.description


def test_module_status_flip_emits_start_then_stop(db):
    t0 = datetime.utcnow()
    seed_scan(db, t0, [], [mod("ollama", "stopped"), mod("docker", "live")])
    detect_changes(db, {}, [], [mod("ollama", "live"), mod("docker", "live")])
    assert events(db) == [("module_started", "ollama")]

    seed_scan(db, t0 + timedelta(seconds=30), [],
              [mod("ollama", "live"), mod("docker", "live")])
    detect_changes(db, {}, [], [mod("ollama", "stopped"), mod("docker", "live")])
    assert events(db)[-1] == ("module_stopped", "ollama")


def test_unseen_module_id_is_not_an_event(db):
    # A resident added to the host config is not a "module started";
    # there is no previous state to have crossed. Recording one would
    # make every config edit look like an outage recovery.
    seed_scan(db, datetime.utcnow(), [], [mod("docker", "live")])
    detect_changes(db, {}, [], [mod("docker", "live"), mod("temporal", "live")])
    assert events(db) == []
