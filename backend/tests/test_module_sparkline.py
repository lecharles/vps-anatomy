"""S24 — per-resident hourly liveness record (/api/modules/{id}/sparkline).

The contract the module-detail mini-sparkline depends on:

  - one row per UTC hour the scanner probed the resident, oldest first;
  - `scans` counts the probes that hour, `live` the probes that found
    it live — the sparkline bar is live/scans, so a blink inside an
    hour lowers the bar instead of vanishing from it;
  - an hour with no probes is ABSENT, never a zero — a gap in the
    record must not read as "down all hour";
  - the window param excludes older rows and rejects nonsense (422).

In-memory database only (conftest `db`), no scanner, no network.
"""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

import main
from database import get_db
from models import ModuleState


@pytest.fixture()
def client(db):
    """App over the empty test database; lifespan (real scanner) never runs."""
    main.app.dependency_overrides[get_db] = lambda: db
    tc = TestClient(main.app)
    yield tc
    main.app.dependency_overrides.clear()


def _probe(db, module_id, at, status):
    db.add(ModuleState(module_id=module_id, name=module_id.title(),
                       status=status, data={}, timestamp=at))
    db.commit()


def test_hour_buckets_count_live_share(db, client):
    # One hour: 4 probes, 3 live. Previous hour: 2 probes, both live.
    now = datetime.utcnow()
    hour_a = now.replace(minute=5, second=0, microsecond=0)
    hour_b = hour_a - timedelta(hours=1)
    for i, status in enumerate(["live", "live", "stopped", "live"]):
        _probe(db, "watcher", hour_a + timedelta(minutes=i), status)
    for status in ["live", "live"]:
        _probe(db, "watcher", hour_b + timedelta(minutes=10), status)

    body = client.get("/api/modules/watcher/sparkline?hours=3").json()
    assert [b["hour"] for b in body] == sorted(b["hour"] for b in body)  # oldest first
    assert len(body) == 2
    older, newest = body
    assert older == {"hour": hour_b.strftime("%Y-%m-%dT%H:00:00Z"), "scans": 2, "live": 2}
    assert newest == {"hour": hour_a.strftime("%Y-%m-%dT%H:00:00Z"), "scans": 4, "live": 3}


def test_probe_crossing_an_hour_boundary_lands_in_its_own_bucket(db, client):
    # A resident that died at :00 shows as a FULL down-hour next to the
    # live hour before it — the blink is visible as a shape, not lost.
    now = datetime.utcnow()
    top = now.replace(minute=0, second=0, microsecond=0)
    _probe(db, "blink", top - timedelta(seconds=1), "live")
    _probe(db, "blink", top, "stopped")
    _probe(db, "blink", top + timedelta(minutes=1), "stopped")

    body = client.get("/api/modules/blink/sparkline?hours=2").json()
    assert [(b["scans"], b["live"]) for b in body] == [(1, 1), (2, 0)]
    down_hour = body[-1]
    assert down_hour["live"] == 0 and down_hour["scans"] == 2  # 0 live, stated — not absent


def test_unprobed_hours_are_absent_not_zero(db, client):
    now = datetime.utcnow().replace(minute=1, second=0, microsecond=0)
    _probe(db, "quiet", now, "live")
    # 5 hours ago too — but the 3 hours between hold no probes at all.
    _probe(db, "quiet", now - timedelta(hours=5), "live")

    body = client.get("/api/modules/quiet/sparkline?hours=24").json()
    assert len(body) == 2                       # the empty hours are gaps, not bars
    hours = [b["hour"] for b in body]
    assert now.strftime("%Y-%m-%dT%H:00:00Z") in hours
    assert (now - timedelta(hours=5)).strftime("%Y-%m-%dT%H:00:00Z") in hours


def test_window_excludes_older_probes(db, client):
    now = datetime.utcnow()
    _probe(db, "keeper", now, "live")
    _probe(db, "keeper", now - timedelta(hours=48), "live")
    body = client.get("/api/modules/keeper/sparkline?hours=24").json()
    assert [b["scans"] for b in body] == [1]
    # same resident, month window: the old hour rides back in
    assert len(client.get("/api/modules/keeper/sparkline?hours=720").json()) == 2


def test_never_probed_resident_answers_empty(db, client):
    assert client.get("/api/modules/phantom/sparkline").json() == []


def test_window_param_is_validated(client):
    assert client.get("/api/modules/x/sparkline?hours=0").status_code == 422
    assert client.get("/api/modules/x/sparkline?hours=721").status_code == 422
