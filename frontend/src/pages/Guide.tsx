import { Fragment } from 'react'

// S15a — the "build your own scanner" guide. The skeleton is lifted
// straight from backend/core/: five small functions, plain dict in/out,
// every field independently fallible.
// S15b — the four load-bearing functions now appear as real excerpts,
// trimmed from backend/core/__init__.py exactly as shipped.
const EXCERPTS = {
  machine: `def scan_machine() -> dict:
    """Collect machine facts natively; each field
       independently falls back."""
    uname = os.uname()
    hostname = uname.nodename or "unknown"
    os_name = _os_release() or f"{uname.sysname} {uname.release}"
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    ram_gb = round(int(line.split()[1]) / 1024 / 1024, 1)
                    break
    except Exception:
        pass                     # this field reads 0.0 — stated, not hidden
    ...
    return {"hostname": hostname, "os": os_name, "arch": arch,
            "cpus": cpus, "ram_gb": ram_gb, "uptime_days": uptime_days, ...}`,

  sockets: `def scan_services() -> list:
    """Parse 'ss -tlnp' defensively; the users field position varies."""
    out = _probe(["ss", "-tlnp"])
    if not out:
        return []
    services, seen = [], set()
    for line in out.splitlines()[1:]:
        cols = line.split()
        if len(cols) < 4:
            continue
        addr = cols[3]
        m = re.search(r":(\\d+)$", addr)
        if not m:
            continue
        port = int(m.group(1))
        bind = addr[: addr.rfind(":")] or "*"
        ...
        services.append({"port": port, "bind": bind, ...
            "public": bind in ("0.0.0.0", "::", "*"), ...})`,

  residents: `def scan_modules() -> list:
    """Status of configured residents. Spec format (host_modules.json):
    [{"module_id": "...", "probe": {"pgrep": pat}
                    | {"port": N} | {"docker": sub}}]"""
    specs = _load_json("host_modules.json") or DEFAULT_MODULES
    modules = []
    for spec in specs:
        probe = spec.get("probe", {})
        status = "stopped"
        if "pgrep" in probe:
            status = "live" if _pgrep_running(probe["pgrep"]) else "stopped"
        if "port" in probe:
            status = "live" if _port_open(int(probe["port"])) else "stopped"
        if "docker" in probe:
            matched = [c for c in containers() if probe["docker"] in c]
            status = "live" if matched else "stopped"
        modules.append({"module_id": spec["module_id"],
                        "name": spec["name"], "status": status, ...})
    return modules`,

  diff: `def detect_changes(db, machine, services, modules):
    """Diff this scan against the previous one and record
       what moved. First-ever scan is a baseline: it records
       nothing so a restart does not flood the feed."""
    latest_ts = db.query(ServiceState.timestamp) ... .first()
    latest_mod_ts = db.query(ModuleState.timestamp) ... .first()

    # Baseline checks BOTH tables: a host with zero listeners still
    # has module history; treating it as "first scan" would mute every
    # module event forever (caught by the S11b change-diff tests).
    baseline = latest_ts is None and latest_mod_ts is None

    if not baseline:
        for port, svc in new_ports.items():
            if port not in prev_ports:
                db.add(Change(change_type="service_started", ...))
        for port, svc in prev_ports.items():
            if port not in new_ports:
                db.add(Change(change_type="service_stopped", ...))
    db.commit()`,
}

const TREE = `my-scanner/
  core.py        the five questions: machine, sockets, residents,
                 diff, remember — pure functions, no framework
  app.py         FastAPI: one router per question, JSON out
  data/          SQLite + host facts. This folder is .gitignore'd —
                 the code is public, the machine is not
  static/        the built frontend, served same-origin`

const STEPS: { n: string; title: string; body: string; ref: string; excerpt?: string }[] = [
  {
    n: '1',
    title: 'Ask the machine',
    body: 'One function, no arguments, returns a dict: cores, RAM, disk, OS name, uptime. Every fact has its own try/except — a field that cannot be read comes back as a stated zero or "unknown", never as a crash, and never as a guess. Read /proc and os.uname() directly; do not shell out for anything Python already knows.',
    ref: 'core.scan_machine()',
    excerpt: EXCERPTS.machine,
  },
  {
    n: '2',
    title: 'Ask the sockets',
    body: 'One command answers "what listens here": ss -tlnp. Parse it defensively — column positions vary between distros — and derive the useful flags instead of storing raw text: is the bind address public, which process claimed the port, and can a name be attributed from a catalog the scanner owns. Ports that belong to other users stay honestly "unattributed": that is permissions, not a bug.',
    ref: 'core.scan_services()',
    excerpt: EXCERPTS.sockets,
  },
  {
    n: '3',
    title: 'Ask the residents',
    body: 'The machine-generic socket scan cannot know which apps YOU installed. So the scanner reads a small spec file — one entry per resident, each declaring exactly one probe: a process pattern, a localhost port, or a container name fragment. "live" or "stopped", nothing fancier. The spec lives beside the database, not in git.',
    ref: 'core.scan_modules()',
    excerpt: EXCERPTS.residents,
  },
  {
    n: '4',
    title: 'Diff against yesterday',
    body: 'A snapshot tells you what is; a diff tells you what happened. Before writing, compare this scan against the previous one and record only what moved: service appeared/vanished, resident flipped state, uptime reset (a reboot). The first-ever scan records nothing — a baseline is not an event — or every restart floods the feed with noise.',
    ref: 'core.detect_changes()',
    excerpt: EXCERPTS.diff,
  },
  {
    n: '5',
    title: 'Remember on purpose',
    body: 'Raw rows every 30 seconds become useless within a week. Roll them up hourly, prune raw data you are entitled to keep short, and let the charts read the rollups. A retention job with a stated window is what turns "a database" into "a history" — and keeps the file small enough to care about.',
    ref: 'core/retention.py',
  },
]

export default function Guide() {
  return (
    <div>
      <div className="page-head">
        <h1>Build your own scanner</h1>
        <p className="sub">This dashboard's whole domain logic is five functions in one file — under 400 lines that read like a checklist. Here is the skeleton, generic by construction: it teaches the shape of the thing, and none of it can leak your machine.</p>
      </div>

      <section>
        <div className="eyebrow">Shape of the project</div>
        <pre className="mono" style={{ fontSize: 12, lineHeight: 1.7, overflowX: 'auto' }}>
          {TREE}
        </pre>
        <p className="sub" style={{ marginTop: 10 }}>
          The rule that makes this publishable: code knows <em>mechanisms</em>, data knows
          <em> the machine</em> — and the data directory is the one you never commit.
        </p>
      </section>

      <section>
        <div className="eyebrow">The five questions, in order</div>
        <p className="sub" style={{ marginBottom: 12 }}>
          Four of them appear as real excerpts, trimmed from{' '}
          <span className="kbd">backend/core/__init__.py</span> — shortened for reading,
          never rewritten: the shipped file is one click deeper at the link below.
        </p>
        <div className="rows">
          {STEPS.map((s) => (
            <Fragment key={s.n}>
              <div className="row">
                <span className="name mono" style={{ color: 'var(--primary-bright)' }}>{s.n} · {s.title}</span>
                <span className="detail">{s.body} <span className="kbd">{s.ref}</span></span>
              </div>
              {s.excerpt && (
                <pre
                  className="mono"
                  style={{
                    margin: 0, padding: '12px 16px', fontSize: 11.5, lineHeight: 1.6,
                    background: 'var(--code-bg)', borderTop: '1px solid var(--hairline)',
                    borderBottom: '1px solid var(--hairline)', overflowX: 'auto',
                    color: 'var(--text-bright)', whiteSpace: 'pre',
                  }}
                >
                  {s.excerpt}
                </pre>
              )}
            </Fragment>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow">Contract every step keeps</div>
        <div className="rows">
          <div className="row"><span className="name">Pure out</span><span className="detail">Each scan function returns plain dicts/lists — no ORM, no framework. The database writer is a separate function, so the scanner is testable with nothing but fixtures.</span></div>
          <div className="row"><span className="name">Fail stated</span><span className="detail">A missing fact is written as zero/'unknown'/None — and the reader UI says so in words. Silence is how stale data passes for truth.</span></div>
          <div className="row"><span className="name">Cheap always</span><span className="detail">One scan must cost almost nothing and never block: probes carry timeouts, and the loop sleeps between rounds instead of reacting to events.</span></div>
        </div>
      </section>

      <p className="seealso">Read the real thing: <a href="https://github.com/lecharles/vps-anatomy/blob/main/backend/core/__init__.py" target="_blank" rel="noreferrer">backend/core/__init__.py ↗</a> · <a href="/architecture">Architecture</a> · <a href="/lessons">Lessons</a></p>
    </div>
  )
}
