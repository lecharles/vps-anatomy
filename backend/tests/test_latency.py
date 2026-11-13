"""S14a — latency probe tests.

Hard rule inherited from conftest: the suite is safe on the live host,
so no test here ever opens a real socket. socket.create_connection is
monkeypatched; the "timing" is scripted sleeps in ms. What is under
test is the DESIGN: median beats mean, failure is a stated None gap,
the port set is deduped and sorted, and the endpoint answers with the
newest probe block only.
"""
import time

import pytest

from core import latency
from models import LatencySample

import main
from database import get_db
from fastapi.testclient import TestClient


@pytest.fixture()
def client(db):
    """App over the empty test database; lifespan (real scanner) never runs."""
    main.app.dependency_overrides[get_db] = lambda: db
    tc = TestClient(main.app)
    yield tc
    main.app.dependency_overrides.clear()


class FakeSock:
    def __enter__(self): return self
    def __exit__(self, *a): return False


def script_delays(monkeypatch, delays_ms, fail_times=()):
    """create_connection sleeps delays_ms[i]; raises on listed attempts."""
    calls = {"n": 0}

    def fake_connect(addr, timeout=None):
        i = calls["n"]
        calls["n"] += 1
        if i in fail_times:
            raise ConnectionRefusedError("no answer")
        time.sleep(delays_ms[i] / 1000.0)
        return FakeSock()

    monkeypatch.setattr(latency.socket, "create_connection", fake_connect)
    return calls


def test_median_of_successes_is_the_published_number(monkeypatch):
    script_delays(monkeypatch, [2.0, 3.0, 2.5])
    out = latency.probe_port(8093)
    assert out["port"] == 8093 and out["ok"] is True and out["hits"] == 3
    assert 2.0 <= out["connect_ms"] <= 3.0


def test_one_slow_outlier_does_not_move_the_median(monkeypatch):
    # fast, wake-up stall, fast — a mean would report ~8 ms, the median ~2.
    script_delays(monkeypatch, [2.0, 20.0, 2.4])
    out = latency.probe_port(8093)
    assert out["connect_ms"] < 5.0


def test_all_probes_dead_is_an_honest_gap(monkeypatch):
    script_delays(monkeypatch, [0, 0, 0], fail_times={0, 1, 2})
    out = latency.probe_port(631)
    assert out["connect_ms"] is None
    assert out["ok"] is False and out["hits"] == 0


def test_partial_failures_stay_partial_not_rounded_up(monkeypatch):
    script_delays(monkeypatch, [0, 3.0], fail_times={0})  # 1st attempt fails
    out = latency.probe_port(8093, probes=2)
    assert out["hits"] == 1 and out["probes"] == 2 and out["ok"] is True


def test_probe_ports_dedupes_and_sorts(monkeypatch):
    script_delays(monkeypatch, [1.0] * 12)
    out = latency.probe_ports([80, 22, 80, 53, 22])
    assert [r["port"] for r in out] == [22, 53, 80]


# ---- HTTP surface ---------------------------------------------------------

def _seed(db, ts, rows):
    for r in rows:
        db.add(LatencySample(timestamp=ts, **r))
    db.commit()


def test_endpoint_serves_only_the_newest_block(client, db):
    from datetime import datetime
    old = datetime(2026, 1, 1, 0, 0, 0)
    new = datetime(2026, 1, 2, 0, 0, 0)
    _seed(db, old, [{"port": 22, "connect_ms": 9.9, "ok": True, "probes": 3, "hits": 3}])
    _seed(db, new, [{"port": 53, "connect_ms": None, "ok": False, "probes": 3, "hits": 0},
                    {"port": 22, "connect_ms": 0.25, "ok": True, "probes": 3, "hits": 3}])

    rows = client.get("/api/latency/").json()
    assert [r["port"] for r in rows] == [22, 53]          # ascending
    assert rows[0]["connect_ms"] == 0.25                  # newest wins
    assert rows[1]["connect_ms"] is None and rows[1]["ok"] is False  # gap stated


def test_endpoint_on_nothing_measured_is_an_empty_list(client):
    assert client.get("/api/latency/").json() == []


def test_history_filters_one_port(client, db):
    from datetime import datetime, timedelta
    base = datetime(2026, 1, 1)
    for i in range(3):
        _seed(db, base + timedelta(minutes=i),
              [{"port": 22, "connect_ms": 0.2 + i, "ok": True, "probes": 3, "hits": 3},
               {"port": 53, "connect_ms": 0.5, "ok": True, "probes": 3, "hits": 3}])

    rows = client.get("/api/latency/history?port=22&limit=10").json()
    assert len(rows) == 3 and all(r["port"] == 22 for r in rows)
    assert rows[0]["timestamp"] > rows[-1]["timestamp"]   # newest first
