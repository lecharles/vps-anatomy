"""Pytest scaffolding for the scanner suite.

Hard rules — the suite must be safe to run on the live host:
  - no subprocesses: command probes are monkeypatched, never really called;
  - no shared state: every test gets a fresh in-memory SQLite database;
  - no writes to the running app: nothing here opens the on-disk scanner
    database (the engine in database.py is only ever *created*, never
    connected to, by an import).

pytest.ini puts ``backend/`` on ``sys.path`` so tests import the flat
backend modules exactly the way the app itself does.
"""
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base

FIXTURES = Path(__file__).parent / "fixtures"

# The generic catalog as shipped in core/__init__.py. On a live host the
# scanner merges gitignored local entries into core.SERVICE_CATALOG at
# import time; tests pin to this table instead so they pass the same way
# on any machine.
GENERIC_CATALOG = {
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


@pytest.fixture(autouse=True)
def pinned_catalog(monkeypatch):
    """Every test sees the generic catalog, never host-local overlays."""
    import core

    monkeypatch.setattr(core, "SERVICE_CATALOG", dict(GENERIC_CATALOG))


@pytest.fixture()
def engine():
    """Throwaway in-memory database with the full schema."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # one connection, one shared in-memory DB
    )
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db(engine):
    """A Session bound to a fresh empty schema, rolled back on teardown."""
    session = sessionmaker(bind=engine)()
    yield session
    session.rollback()
    session.close()


@pytest.fixture()
def ss_text() -> str:
    """Sample `ss -tlnp` output — synthetic, shaped like real hosts emit."""
    return (FIXTURES / "ss_tlnp.txt").read_text()


@pytest.fixture()
def probe_ss(monkeypatch, ss_text):
    """Point core._probe at the ss fixture; any other command yields None."""
    import core

    def fake(cmd, timeout=5):
        return ss_text if cmd == ["ss", "-tlnp"] else None

    monkeypatch.setattr(core, "_probe", fake)
    return fake
