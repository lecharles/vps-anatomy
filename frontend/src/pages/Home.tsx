import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import TrendBars, { rollupDaily, type TrendPoint } from '../components/TrendBars'
import PeriodToggle, { PERIOD_HOURS, type Period } from '../components/PeriodToggle'

type Machine = {
  hostname: string; os: string; arch: string; cpus: number; ram_gb: number
  disk_total_gb: number; disk_used_gb: number; uptime_days: number; ip_public: string
  timestamp: string
}
type Service = { port: number; bind: string; name: string; owner: string; public: boolean; status: string }
type TrendRow = { hour: string; services_listening: number | null }

// S12b legend copy per period: the chart names itself — series, what a
// value counts, what a bar spans. Blue bars live on Home, green ones on
// Architecture; the swatch color comes from the accent the page passes.
const PERIOD_COPY: Record<Period, { title: string; sub: string; aria: string; empty: string; perBar: string }> = {
  day: {
    title: 'A day of listeners',
    sub: 'Distinct TCP ports the scanner caught in each UTC hour — an hourly rollup from /api/trends, newest at the right. Bars use a square-root scale so small, honest changes stay visible.',
    aria: 'Distinct services listening per hour, last 24 hours',
    empty: 'No recorded hours yet — history builds as the scanner runs.',
    perBar: 'one bar = one UTC hour',
  },
  week: {
    title: 'A week of listeners',
    sub: 'One bar per UTC day over the last seven — each day is the mean of its hourly rollups from /api/trends (hours=168), newest at the right. Square-root scale keeps the quiet days legible.',
    aria: 'Distinct services listening per day, last 7 days',
    empty: 'No recorded days yet — the week needs at least one scan.',
    perBar: 'one bar = one UTC day, mean of its hours',
  },
  month: {
    title: 'A month of listeners',
    sub: 'One bar per UTC day over the last thirty — each day is the mean of its hourly rollups from /api/trends (hours=720), newest at the right. Square-root scale keeps the quiet days legible.',
    aria: 'Distinct services listening per day, last 30 days',
    empty: 'No recorded days yet — the month needs at least one scan.',
    perBar: 'one bar = one UTC day, mean of its hours',
  },
}

export default function Home() {
  const { data: machine } = useApi<Machine>('/api/machine/')
  const { data: services } = useApi<Service[]>('/api/services/', 30000)
  const [period, setPeriod] = useState<Period>('day')
  const { data: svcTrend } = useApi<TrendRow[]>(
    `/api/trends/?hours=${PERIOD_HOURS[period]}&metrics=services`,
    60000,
  )

  const live = services ?? []
  const nPublic = live.filter((s) => s.public).length
  const diskPct = machine && machine.disk_total_gb > 0
    ? Math.round((machine.disk_used_gb / machine.disk_total_gb) * 100) : null

  const hourly = (svcTrend ?? []).map((t): TrendPoint => ({ hour: t.hour, value: t.services_listening }))
  const trendPoints = period === 'day' ? hourly : rollupDaily(hourly)
  const copy = PERIOD_COPY[period]

  return (
    <>
      <div className="hero">
        <h1>A live AI agent server,<br />explained.</h1>
        <p className="lede">
          <strong className="mono" style={{ color: 'var(--text-bright)' }}>{machine?.hostname ?? 'this server'}</strong> is a
          {' '}{machine?.cpus ?? '—'}-core Ubuntu server running two AI agents, a fleet of web services,
          containers, schedulers and stores. Every fact on these pages
          is read from the live server, not hard-coded.
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
        <div className="sec-head">
          <div>
            <h2 className="sec">{copy.title}</h2>
            <p className="sec-sub">{copy.sub}</p>
          </div>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
        <div className="diagram">
          <TrendBars
            points={trendPoints}
            tickStyle={period === 'day' ? 'hour' : 'date'}
            label={copy.aria}
            emptyText={copy.empty}
            seriesName="Listeners"
            unit="distinct TCP ports"
            perBar={copy.perBar}
          />
        </div>
      </section>

      <section>
        <h2 className="sec">What this server does</h2>
        <p className="sec-sub">Four roles, stacked. Each one is a lesson in the course.</p>
        <div className="card-grid">
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L1</span> Hardware & OS</h3>
            <p className="desc">Ubuntu 24.04 on {machine?.cpus ?? '—'} cores, {machine?.ram_gb ?? '—'} GB RAM, {machine?.uptime_days ?? '—'} days of uptime. Hardware and OS as the floor everything else stands on.</p>
          </a>
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L2</span> Agents</h3>
            <p className="desc">Two agent runtimes and a shared coding engine. Software that reads, decides, and acts on this server through messaging lanes and terminals. Their names come from the live scanner.</p>
          </a>
          <a className="card" href="/lessons">
            <h3><span className="num-tag">L3</span> Services & ports</h3>
            <p className="desc">{live.length} TCP listeners right now: web apps, a model runtime, databases, schedulers — each named by the scanner.</p>
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
              <span className="detail">{s.owner !== 'unknown' ? <>process <span className="mono">{s.owner}</span></> : 'root-owned · name not visible to this scanner'}</span>
              <span className="right">{s.public ? 'public' : s.bind}</span>
            </div>
          ))}
          {live.length === 0 && <div className="empty">First scan pending — the scanner starts 30s after boot.</div>}
        </div>
      </section>

      <section>
        <p className="muted">
          New here? Start with <a href="/lessons">Lesson 1 — What is this server?</a> ·
          Curious what changed? <a href="/changes">Changes feed</a> ·
          Full system map: <a href="/architecture">Architecture</a>
        </p>
      </section>
    </>
  )
}
