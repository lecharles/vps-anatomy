"""S11a — `ss -tlnp` parsing tests for the service scanner.

The fixture in tests/fixtures/ss_tlnp.txt is synthetic but shaped like
real ss output: an IPv4 and an IPv6 row per socket family, a port with no
users field (socket owned by another user), a systemd-resolved stub
address with an interface suffix, a bracketed IPv6 wildcard, and one
malformed line. Every edge here was a line a naive splitter would choke
on in the field.
"""
import core
from core import scan_services


def test_scaffold_db_fixture_is_a_working_schema(db):
    """conftest really gives every test a fresh, writable SQLite schema."""
    from models import MachineState

    db.add(MachineState(hostname="testhost"))
    db.commit()
    assert db.query(MachineState).count() == 1
    assert db.query(MachineState).first().timestamp is not None


def test_parses_every_listener_exactly_once(probe_ss):
    services = scan_services()
    assert sorted(s["port"] for s in services) == [22, 53, 443, 2222, 3306, 6379, 9090]
    assert len(services) == len({s["port"] for s in services})


def test_duplicate_family_rows_collapse_to_first_seen(probe_ss):
    """Port 22 appears twice (sshd, two fds); the first row must win."""
    services = {s["port"]: s for s in scan_services()}
    assert services[22]["bind"] == "0.0.0.0"
    assert services[22]["owner"] == "sshd"


def test_public_flag_reads_the_bind_not_the_address_shape(probe_ss):
    services = {s["port"]: s for s in scan_services()}
    assert services[22]["public"] is True      # 0.0.0.0 wildcard
    assert services[443]["public"] is True     # bracketed IPv6 wildcard [::]
    assert services[9090]["public"] is False   # [::1] loopback
    assert services[6379]["public"] is False   # 127.0.0.1
    assert services[53]["public"] is False     # 127.0.0.53%lo stub with suffix


def test_owner_parsed_from_users_field_and_missing_field_falls_back(probe_ss):
    services = {s["port"]: s for s in scan_services()}
    assert services[22]["owner"] == "sshd"
    # Redis row has no users:(...) at all — visible port, invisible process.
    assert services[6379]["owner"] == "unknown"
    assert services[6379]["name"] == "Redis"  # still labeled by the port catalog


def test_catalog_labels_applied_during_parse(probe_ss):
    services = {s["port"]: s for s in scan_services()}
    assert services[443]["name"] == "HTTPS"
    assert services[53]["name"] == "DNS resolver"
    assert services[3306]["name"] == "MySQL"
    # 2222: not in the port catalog, sshd is not a hinted process name.
    # The honest answer is "unattributed", not a guess.
    assert services[2222]["name"] == "unattributed listener"
    for s in services.values():
        assert s["protocol"] == "tcp"
        assert s["status"] == "running"


def test_malformed_and_empty_probe_output_never_raises(monkeypatch):
    for broken in ("", None, "LISTEN 0 128"):
        monkeypatch.setattr(core, "_probe", lambda cmd, timeout=5, _b=broken: _b)
        assert scan_services() == []
