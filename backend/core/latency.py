"""S14a — localhost hop-latency probes: the design and the first numbers.

Signal Flow claims everything except the model call runs on this one
machine. "Local" is measurable: a loopback TCP connect is the kernel
handing a SYN to a listening socket and taking the SYN/ACK back — the
cheapest real hop the system makes, and the one every panel on this
site rides.

The design, pinned in code:

  - probe exactly the ports the SAME scan found listening, on 127.0.0.1.
    This app's own port is in that set, so the dashboard times itself
    like any other resident — the most honest calibration hop there is;
  - connect-only. We never send application bytes, never read a reply.
    The measurement is the handshake, not the conversation;
  - 3 probes per port, 200 ms ceiling each, timed with the monotonic
    counter. The recorded number is the MEDIAN of the successes: one
    wake-up outlier out of three must not move a published figure;
  - a port whose probes all fail records connect_ms = None with
    ok = False and hits = 0 — a stated gap, never a zero that would
    look like "instantly";
  - failure containment: a probe exception can never fail a scan. The
    probes run in a worker thread so a slow kernel never stalls the
    event loop, and the scan loop stores whatever came back.

The numbers land in latency_samples, one row per (scan, port), and are
served at /api/latency/ as raw measurements — no smoothing, no rollups.
Charts can ride them later (S14b); for now the first numbers stand on
their own.
"""
import socket
import statistics
import time

PROBE_COUNT = 3
PROBE_TIMEOUT_S = 0.2


def probe_port(port: int, probes: int = PROBE_COUNT,
               timeout_s: float = PROBE_TIMEOUT_S) -> dict:
    """Median loopback connect ms for one port. See module design."""
    samples = []
    for _ in range(probes):
        t0 = time.perf_counter()
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=timeout_s):
                samples.append((time.perf_counter() - t0) * 1000.0)
        except OSError:
            continue
    if not samples:
        return {"port": port, "connect_ms": None, "ok": False,
                "probes": probes, "hits": 0}
    return {"port": port, "connect_ms": round(statistics.median(samples), 3),
            "ok": True, "probes": probes, "hits": len(samples)}


def probe_ports(ports) -> list:
    """Probe the scanned set once each, ascending by port."""
    return [probe_port(p) for p in sorted(set(ports))]
