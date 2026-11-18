"""S27 — /api/trends/export, the CSV face of the hourly rollup.

The contract the downloaded file keeps with its JSON twin:

  - ONE computation, two serializations: `/export` runs the exact
    `_rollup` that `/api/trends/` answers from, so a chart and a
    spreadsheet can never disagree about what an hour recorded;
  - `hour` and `scans` are always columns; a selected metric gets its
    column, an unselected metric gets NO column (JSON answers null —
    CSV states the omission structurally);
  - a selected metric with no recorded value leaves that field EMPTY —
    never a fake zero, the same gap contract every series keeps;
  - a window with no recorded data is a header-only file;
  - the 422 validation (unknown metric, empty list, out-of-range hours)
    is inherited unchanged — a bad query answers JSON, never a CSV that
    quietly omits a series.

In-memory database only (conftest `db`), no scanner, no network.
"""
import csv
import io
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

import main
from database import get_db
from models import MachineState, ModuleState, ServiceState, TrendHour


@pytest.fixture()
def client(db):
    """App over the empty test database; lifespan (real scanner) never runs."""
    main.app.dependency_overrides[get_db] = lambda: db
    tc = TestClient(main.app)
    yield tc
    main.app.dependency_overrides.clear()


def _scan(db, at, *, ram=8.0, disk=20.0, ports=(22, 80, 443), live=("a",), down=()):
    """One synthetic 30-second scan: a machine row, listener rows, probe rows."""
    db.add(MachineState(timestamp=at, hostname="demo", os="Linux", arch="x86_64",
                        cpus=2, ram_gb=ram, disk_total_gb=40.0, disk_used_gb=disk,
                        uptime_days=1, ip_public="unknown"))
    for port in ports:
        db.add(ServiceState(timestamp=at, port=port, bind="0.0.0.0",
                            name=f"p{port}", owner="root", protocol="tcp",
                            public=False, status="running"))
    for mid in live:
        db.add(ModuleState(module_id=mid, name=mid.title(), status="live",
                           data={}, timestamp=at))
    for mid in down:
        db.add(ModuleState(module_id=mid, name=mid.title(), status="stopped",
                           data={}, timestamp=at))
    db.commit()


def _rows(resp):
    return list(csv.DictReader(io.StringIO(resp.text)))


def test_csv_rows_equal_the_json_rollup(db, client):
    now = datetime.utcnow().replace(minute=7, second=0, microsecond=0)
    _scan(db, now - timedelta(hours=1), ram=8.0, disk=20.0,
          ports=(22, 80), live=("a", "b"))
    _scan(db, now, ram=8.4, disk=20.2, ports=(22, 80, 443), live=("a",), down=("b",))
    _scan(db, now, ram=8.6, disk=20.4, ports=(22, 80, 443), live=("a", "b"))

    js = client.get("/api/trends/?hours=3&metrics=services,modules,ram,disk").json()
    csv_resp = client.get("/api/trends/export?hours=3&metrics=services,modules,ram,disk")
    rows = _rows(csv_resp)
    assert len(rows) == len(js) == 2                      # one row per recorded hour
    for row, point in zip(rows, js):                      # same order, same numbers
        assert row["hour"] == point["hour"]
        for field in ("scans", "services_listening", "modules_live"):
            assert int(row[field]) == point[field]
        for field in ("ram_gb_avg", "disk_used_gb_avg"):
            assert float(row[field]) == pytest.approx(point[field])
    # hour with two machine rows averages them: (8.4+8.6)/2
    assert float(rows[1]["ram_gb_avg"]) == pytest.approx(8.5)


def test_unselected_metrics_get_no_column_at_all(client, db):
    now = datetime.utcnow().replace(minute=3, second=0, microsecond=0)
    _scan(db, now)
    rows = _rows(client.get("/api/trends/export?hours=2&metrics=services,ram"))
    assert list(rows[0].keys()) == ["hour", "scans", "services_listening", "ram_gb_avg"]
    assert "modules_live" not in rows[0] and "disk_used_gb_avg" not in rows[0]


def test_empty_window_is_a_header_only_file(client):
    resp = client.get("/api/trends/export?hours=24")
    body = resp.text.splitlines()
    assert len(body) == 1                                 # header, no invented rows
    assert body[0] == "hour,scans,services_listening,modules_live,ram_gb_avg,disk_used_gb_avg"


def test_no_recorded_value_leaves_the_field_empty(db, client):
    # Listeners in the hour, but no machine row: ram/disk were never sampled.
    now = datetime.utcnow().replace(minute=1, second=0, microsecond=0)
    db.add(ServiceState(timestamp=now, port=22, bind="0.0.0.0", name="ssh",
                        owner="root", protocol="tcp", public=False,
                        status="running"))
    db.commit()
    row = _rows(client.get("/api/trends/export?hours=2&metrics=services,ram"))[0]
    assert row["services_listening"] == "1"               # recorded
    assert row["ram_gb_avg"] == ""                        # absent, not zero
    assert row["scans"] == "0"                            # no machine rows behind it


def test_validation_errors_answer_json_never_a_bad_csv(client):
    for bad in ("metrics=bogus", "metrics=%20,", "hours=0", "hours=721"):
        resp = client.get(f"/api/trends/export?{bad}")
        assert resp.status_code == 422, bad
        assert "text/csv" not in resp.headers["content-type"]
    assert "services" in client.get("/api/trends/export?metrics=nope").json()["detail"]


def test_export_carries_download_headers_and_archived_hours(db, client):
    # An hour only the archive still holds (raw rows pruned) rides along.
    closed = (datetime.utcnow().replace(minute=0, second=0, microsecond=0)
              - timedelta(hours=2)).strftime("%Y-%m-%dT%H:00:00Z")
    db.add(TrendHour(hour=closed, scans=120, services_listening=9,
                     modules_live=4, ram_gb_avg=7.1, disk_used_gb_avg=21.0))
    db.commit()
    resp = client.get("/api/trends/export?hours=3&metrics=services")
    assert resp.headers["content-type"].startswith("text/csv")
    assert resp.headers["content-disposition"] == 'attachment; filename="trends-3h.csv"'
    row = _rows(resp)[0]
    assert row["hour"] == closed and row["services_listening"] == "9"
    assert "ram_gb_avg" not in row                        # not selected -> no column
