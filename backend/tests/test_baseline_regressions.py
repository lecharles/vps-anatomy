"""S11c — empty-database and first-scan baseline regressions.

The v0.2 bug class, named once and for all: a brand-new (or restarted)
app with zero history must NOT flood the Changes feed, must answer
/healthz with an honest 503 `no-scans` (not a fake 200), must serve
/api/trends as an empty list (not a 500), and must survive a retention
pass with nothing to retain. Every test here seeds exactly the state the
first minute of a fresh install produces.

The TestClient is built without its context manager, so the app's
lifespan never runs: no real scan loop, no writes to the live database.
All routes read from the test's in-memory session via a dependency
override.
"""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

import core
import main
from database import get_db
from models import Change, MachineState, ModuleState, ServiceState


@pytest.fixture()
def client(db):
    """App over the empty test database; lifespan (real scanner) never runs."""
    main.app.dependency_overrides[get_db] = lambda: db
    tc = TestClient(main.app)
    yield tc
    main.app.dependency_overrides.clear()


def store_scan(db, ts, services, modules):
    """The scan loop's exact write order: diff first, then persist."""
    core.detect_changes(db, {}, services, modules)
    db.add(MachineState(timestamp=ts, hostname="testhost", os="TestOS",
                        arch="x86_64", cpus=2, ram_gb=4.0,
                        disk_total_gb=20.0, disk_used_gb=8.0, uptime_days=1,
                        ip_public="unknown"))
    for s in services:
        db.add(ServiceState(timestamp=ts, **s))
    for m in modules:
        db.add(ModuleState(timestamp=ts, **m))
    db.commit()


# ---- HTTP surface on a virgin database -----------------------------------

def test_healthz_on_empty_db_is_honest_503(client):
    r = client.get("/healthz")
    assert r.status_code == 503
    body = r.json()
    assert body["status"] == "no-scans"
    assert body["seconds_since_last_scan"] is None


def test_healthz_ok_while_scans_are_fresh(client, db):
    store_scan(db, datetime.utcnow(), [], [])
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_healthz_503_when_scan_loop_stalled(client, db):
    store_scan(db, datetime.utcnow() - timedelta(seconds=300), [], [])
    r = client.get("/healthz")
    assert r.status_code == 503
    body = r.json()
    assert body["status"] == "stale"
    assert body["seconds_since_last_scan"] > 290


def test_trends_on_empty_db_is_an_empty_200(client):
    r = client.get("/api/trends/?hours=24")
    assert r.status_code == 200
    assert r.json() == []


def test_trends_rejects_bogus_and_empty_metric_lists(client):
    assert client.get("/api/trends/?metrics=bogus").status_code == 422
    assert client.get("/api/trends/?metrics=,%20,").status_code == 422
    assert client.get("/api/trends/?metrics=ram,%20DISK").status_code == 200


def test_trends_serves_the_very_first_scan(client, db):
    services = [
        {"port": 22, "bind": "0.0.0.0", "name": "SSH", "owner": "sshd",
         "protocol": "tcp", "public": True, "status": "running"},
        {"port": 443, "bind": "::", "name": "HTTPS", "owner": "caddy",
         "protocol": "tcp", "public": True, "status": "running"},
    ]
    store_scan(db, datetime.utcnow(), services,
               [{"module_id": "docker", "name": "Docker", "status": "live", "data": {}}])
    buckets = client.get("/api/trends/?hours=1&metrics=services,modules,ram").json()
    assert len(buckets) == 1
    b = buckets[0]
    assert b["services_listening"] == 2
    assert b["modules_live"] == 1
    assert b["ram_gb_avg"] == 4.0


# ---- the change feed stays silent exactly when it must -------------------

def test_first_scan_never_fills_the_feed(db):
    n_before = db.query(Change).count()
    store_scan(db, datetime.utcnow(),
               [{"port": 22, "bind": "0.0.0.0", "name": "SSH", "owner": "sshd",
                 "protocol": "tcp", "public": True, "status": "running"}],
               [{"module_id": "ollama", "name": "Ollama", "status": "live", "data": {}}])
    assert db.query(Change).count() == n_before == 0


def test_restart_flood_regression(db):
    """The v0.2 failure mode: bounce the app, watch 'service started' spam.

    With baseline suppression, a restart whose first scan sees the same
    world records nothing; only genuine drift after that is an event.
    """
    services = [{"port": p, "bind": "0.0.0.0", "name": f"s{p}", "owner": "x",
                 "protocol": "tcp", "public": True, "status": "running"}
                for p in (22, 80, 443)]
    modules = [{"module_id": "docker", "name": "Docker", "status": "live", "data": {}}]
    t0 = datetime.utcnow()
    store_scan(db, t0, services, modules)          # boot scan: silent
    store_scan(db, t0 + timedelta(seconds=30), services, modules)  # idle: silent
    assert db.query(Change).count() == 0
    drifted = services + [{"port": 8080, "bind": "0.0.0.0", "name": "app",
                           "owner": "node", "protocol": "tcp", "public": True,
                           "status": "running"}]
    store_scan(db, t0 + timedelta(seconds=60), drifted, modules)   # drift: one event
    assert db.query(Change).count() == 1


# ---- retention on a virgin database ---------------------------------------

def test_retention_on_empty_db_is_safe(db):
    from core import retention

    assert retention.rollup_hours(db) == 0
    assert db.query(MachineState).count() == 0
    deleted = retention.prune_raw(db)
    # S14a: latency_samples joined the pruned set — loopback probes land
    # every scan, so they age out exactly like raw rows. This pin is the
    # prune-table contract: update it when the raw layer changes.
    assert deleted == {"machine_states": 0, "service_states": 0,
                       "module_states": 0, "latency_samples": 0}
    # run_once must print its one-liner and raise nothing.
    retention.run_once(db)


def test_maybe_run_fires_once_then_idles(db, monkeypatch):
    from core import retention

    calls = []
    monkeypatch.setattr(retention, "_last_run", None)
    monkeypatch.setattr(retention, "run_once", lambda d: calls.append(1))
    retention.maybe_run(db)   # first pass after "startup" always runs
    retention.maybe_run(db)   # cadence gate holds it back
    assert calls == [1]
