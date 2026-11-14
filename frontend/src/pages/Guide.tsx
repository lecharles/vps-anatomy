// S15a — the "build your own scanner" guide. The skeleton is lifted
// straight from backend/core/: five small functions, plain dict in/out,
// every field independently fallible. S15b adds the real excerpts.

const TREE = `my-scanner/
  core.py        the five questions: machine, sockets, residents,
                 diff, remember — pure functions, no framework
  app.py         FastAPI: one router per question, JSON out
  data/          SQLite + host facts. This folder is .gitignore'd —
                 the code is public, the machine is not
  static/        the built frontend, served same-origin`

const STEPS = [
  {
    n: '1',
    title: 'Ask the machine',
    body: 'One function, no arguments, returns a dict: cores, RAM, disk, OS name, uptime. Every fact has its own try/except — a field that cannot be read comes back as a stated zero or "unknown", never as a crash, and never as a guess. Read /proc and os.uname() directly; do not shell out for anything Python already knows.',
    ref: 'core.scan_machine()',
  },
  {
    n: '2',
    title: 'Ask the sockets',
    body: 'One command answers "what listens here": ss -tlnp. Parse it defensively — column positions vary between distros — and derive the useful flags instead of storing raw text: is the bind address public, which process claimed the port, and can a name be attributed from a catalog the scanner owns. Ports that belong to other users stay honestly "unattributed": that is permissions, not a bug.',
    ref: 'core.scan_services()',
  },
  {
    n: '3',
    title: 'Ask the residents',
    body: 'The machine-generic socket scan cannot know which apps YOU installed. So the scanner reads a small spec file — one entry per resident, each declaring exactly one probe: a process pattern, a localhost port, or a container name fragment. "live" or "stopped", nothing fancier. The spec lives beside the database, not in git.',
    ref: 'core.scan_modules()',
  },
  {
    n: '4',
    title: 'Diff against yesterday',
    body: 'A snapshot tells you what is; a diff tells you what happened. Before writing, compare this scan against the previous one and record only what moved: service appeared/vanished, resident flipped state, uptime reset (a reboot). The first-ever scan records nothing — a baseline is not an event — or every restart floods the feed with noise.',
    ref: 'core.detect_changes()',
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
        <div className="rows">
          {STEPS.map((s) => (
            <div className="row" key={s.n}>
              <span className="name mono" style={{ color: 'var(--primary-bright)' }}>{s.n} · {s.title}</span>
              <span className="detail">{s.body} <span className="kbd">{s.ref}</span></span>
            </div>
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
