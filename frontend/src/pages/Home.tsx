import { useApi } from '../hooks/useApi'

type Machine = {
  hostname: string; os: string; arch: string; cpus: number; ram_gb: number
  disk_total_gb: number; disk_used_gb: number; uptime_days: number; ip_public: string
  timestamp: string
}
type Service = { port: number; bind: string; name: string; owner: string; public: boolean; status: string }

export default function Home() {
  const { data: machine } = useApi<Machine>('/api/machine/')
  const { data: services } = useApi<Service[]>('/api/services/', 30000)

  const live = services ?? []
  const nPublic = live.filter((s) => s.public).length
  const diskPct = machine && machine.disk_total_gb > 0
    ? Math.round((machine.disk_used_gb / machine.disk_total_gb) * 100) : null

  return (
    <>
      <div className="hero">
        <h1>A live AI-agent machine,<br />explained.</h1>
        <p className="lede">
          <strong className="mono" style={{ color: 'var(--text-bright)' }}>{machine?.hostname ?? 'this server'}</strong> is a
          {' '}{machine?.cpus ?? '—'}-core Ubuntu server running two AI agents, a fleet of web services,
          containers, schedulers and stores. This site reads the machine itself — every fact on these
          pages is scanned live, not hard-coded.
        </p>
        <p className="stamp">
          {live.length > 0 ? <>data as of <b>last scan</b> · <span className="live-label">● auto-refresh 30s</span></> : 'first scan pending…'}
        </p>
      </div>

      <div className="pills">
        <div className="pill"><div className="v g">{live.length}</div><div className="k">Services listening</div><div className="s">{nPublic} public · {live.length - nPublic} local</div></div>
        <div className="pill"><div className="v p">{machine?.cpus ?? '—'}</div><div className="k">CPU cores</div><div className="s">{machine?.arch ?? ''}</div></div>
        <div className="pill"><div className="v">{machine ? `${machine.ram_gb} GB` : '—'}</div><div className="k">RAM</div><div className="s">{machine?.os ?? ''}</div></div>
        <div className="pill"><div className="v y">{diskPct !== null ? `${diskPct}%` : '—'}</div><div className="k">Disk used</div><div className="s">{machine ? `${machine.disk_used_gb} of ${machine.disk_total_gb} GB` : ''}</div></div>
        <div className="pill"><div className="v">{machine?.uptime_days ?? '—'}d</div><div className="k">Uptime</div><div className="s">{machine?.ip_public ?? ''}</div></div>
      </div>

      <section>
        <h2 className="sec">What this machine does</h2>
        <p className="sec-sub">Four roles, stacked. Each one is a lesson in the course.</p>
        <div className="card-grid">
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L1</span> The substrate</h3>
            <p className="desc">Ubuntu 24.04 on {machine?.cpus ?? '—'} cores, {machine?.ram_gb ?? '—'} GB RAM, {machine?.uptime_days ?? '—'} days of uptime. Hardware and OS as the floor everything else stands on.</p>
          </a>
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L2</span> The agents</h3>
            <p className="desc">Two agent runtimes and a shared coding engine. Software that reads, decides, and acts on this machine through messaging lanes and terminals. Their names come from the live scanner.</p>
          </a>
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L3</span> The plumbing</h3>
            <p className="desc">{live.length} TCP listeners right now: web apps, a model runtime, databases, schedulers — each named by the scanner. Ports as the machine’s vocabulary.</p>
          </a>
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L4</span> Boundaries</h3>
            <p className="desc">Two users, root, containers, secrets, public vs local binds. Where one agent’s power stops and another’s begins.</p>
          </a>
        </div>
      </section>

      <section>
        <h2 className="sec">What’s live right now</h2>
        <p className="sec-sub">Every TCP listener the scanner found, sorted by port. The same data the whole site reads.</p>
        <div className="rows">
          <div className="row row-head">
            <span className="dot n" style={{ opacity: 0 }} />
            <span className="name">SERVICE</span>
            <span className="detail">WHAT IT IS</span>
            <span className="right">BIND</span>
          </div>
          {[...live].sort((a, b) => a.port - b.port).map((s) => (
            <div className="row" key={s.port}>
              <span className={s.public ? 'dot g' : 'dot n'} />
              <span className="name mono" style={{ fontSize: 12.5 }}>{s.name} <span className="chip port">:{s.port}</span></span>
              <span className="detail">{s.owner !== 'unknown' ? <>process <span className="mono">{s.owner}</span></> : 'root-owned · invisible to this scanner’s user'}</span>
              <span className="right">{s.public ? 'public' : s.bind}</span>
            </div>
          ))}
          {live.length === 0 && <div className="empty">First scan pending — the scanner starts 30s after boot.</div>}
        </div>
      </section>

      <section>
        <p className="muted">
          New here? Start with <a href="/lessons">Lesson 1 — What is this machine?</a> ·
          Curious what changed? <a href="/changes">Changes feed</a> ·
          Full system map: <a href="/architecture">Architecture</a>
        </p>
      </section>
    </>
  )
}
