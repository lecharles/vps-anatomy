"""S13b — config citation tests.

The citation contract for `/api/services/`: a port row may name a config
path ONLY when `os.path.exists` proves it on this disk at read time.
The candidate map is generic distro mechanism; a row whose candidates
all died ships `config: null` and the UI calls it a gap — honesty over
coverage. These tests never touch real system paths: candidates are
monkeypatched to tmp files, and the HTTP surface rides the in-memory DB.
"""
import core
from core import config_citation
from models import ServiceState

import pytest
from fastapi.testclient import TestClient

import main
from database import get_db


@pytest.fixture()
def client(db):
    """App over the empty test database; lifespan (real scanner) never runs."""
    main.app.dependency_overrides[get_db] = lambda: db
    tc = TestClient(main.app)
    yield tc
    main.app.dependency_overrides.clear()


def test_unknown_port_cites_nothing():
    assert config_citation(41234) is None


def test_first_surviving_candidate_wins(monkeypatch, tmp_path):
    ghost = str(tmp_path / "gone.conf")           # never exists
    real = tmp_path / "sshd_config"
    real.write_text("Port 22\n")                  # exists
    monkeypatch.setattr(core, "CONFIG_CANDIDATES", {22: [ghost, str(real)]})
    assert config_citation(22) == str(real)


def test_all_candidates_dead_is_an_honest_none(monkeypatch, tmp_path):
    monkeypatch.setattr(core, "CONFIG_CANDIDATES",
                        {80: [str(tmp_path / "nginx.conf")]})
    assert config_citation(80) is None


def test_tilde_expands_against_home(monkeypatch, tmp_path):
    monkeypatch.setenv("HOME", str(tmp_path))
    (tmp_path / ".ollama").mkdir()
    monkeypatch.setattr(core, "CONFIG_CANDIDATES", {11434: ["~/.ollama"]})
    assert config_citation(11434) == str(tmp_path / ".ollama")


def test_shipped_map_is_distro_paths_only():
    # Mechanism, not host facts: every shipped candidate is an absolute
    # distro path or a home-relative one, and the map covers real ports.
    for port, cands in core.CONFIG_CANDIDATES.items():
        assert isinstance(port, int) and 0 < port < 65536
        assert cands and all(c.startswith("/") or c.startswith("~/")
                             for c in cands)


def test_api_row_carries_living_citation(client, db, monkeypatch, tmp_path):
    from datetime import datetime

    conf = tmp_path / "my.cnf"
    conf.write_text("[mysqld]\n")
    monkeypatch.setattr(core, "CONFIG_CANDIDATES", {3306: [str(conf)]})
    ts = datetime.utcnow()
    db.add(ServiceState(timestamp=ts, port=3306, bind="127.0.0.1",
                        name="MySQL", owner="mysqld", protocol="tcp",
                        public=False, status="up"))
    db.commit()

    rows = client.get("/api/services/").json()
    assert len(rows) == 1
    assert rows[0]["config"] == str(conf)


def test_api_row_ships_null_not_a_guess(client, db, monkeypatch, tmp_path):
    from datetime import datetime

    monkeypatch.setattr(core, "CONFIG_CANDIDATES", {3306: [str(tmp_path / "gone")]})
    ts = datetime.utcnow()
    db.add(ServiceState(timestamp=ts, port=3306, bind="127.0.0.1",
                        name="MySQL", owner="mysqld", protocol="tcp",
                        public=False, status="up"))
    db.commit()

    row = client.get("/api/services/").json()[0]
    assert row["config"] is None
