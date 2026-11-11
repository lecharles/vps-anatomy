"""S11b — catalog mapping tests.

_label_service has three tiers, and the order is the contract:
the port catalog wins, then a process-name hint, then the honest
"unattributed listener". A wrong order is a wrong sign on the Architecture
page, so the order itself is under test.
"""
import core
from core import _label_service


def test_known_port_uses_the_catalog_entry(pinned_catalog):
    name, kind, desc = _label_service(22, "python")  # the process must NOT win
    assert (name, kind) == ("SSH", "system")
    assert desc == "Remote administration."


def test_catalog_beats_process_hint(pinned_catalog):
    name, kind, _ = _label_service(5432, "postgres")
    assert (name, kind) == ("PostgreSQL", "database")


def test_process_hint_when_the_port_is_unknown():
    name, kind, desc = _label_service(41234, "caddy")
    assert (name, kind) == ("caddy", "process")
    assert "Reverse proxy" in desc


def test_unattributed_is_the_fallback_not_a_guess():
    name, kind, desc = _label_service(41234, "somepid")
    assert name == "unattributed listener"
    assert kind == "system"
    assert "permissions, not a bug" in desc


def test_missing_process_name_still_gets_a_label():
    # ss showed the port but the users field was invisible (other owner).
    name, _, _ = _label_service(41234, None)
    assert name == "unattributed listener"


def test_catalog_entries_are_wellformed_triples(pinned_catalog):
    for port, entry in core.SERVICE_CATALOG.items():
        assert isinstance(port, int) and 0 < port < 65536
        assert len(entry) == 3
        assert all(isinstance(part, str) and part for part in entry)
        assert entry[2].endswith(".")
