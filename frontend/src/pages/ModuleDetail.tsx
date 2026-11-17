import { useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { MODULE_INFO } from './Modules'

type Module = { module_id: string; name: string; status: string; data: Record<string, unknown>; timestamp: string }

// S24 — per-hour liveness record from /api/modules/{id}/sparkline.
type ModuleHour = { hour: string; scans: number; live: number }

const SLOTS = 24 // trailing UTC hours drawn as bars

/** Hour keys for the trailing SLOTS hours, oldest first — the axis the
 *  sparkline draws. Buckets the API omits stay visible as thin ticks:
 *  an unprobed hour is a gap in the record, never a silent zero. */
function hourKeys(): string[] {
  const top = new Date()
  top.setUTCMinutes(0, 0, 0)
  return Array.from({ length: SLOTS }, (_, i) =>
    new Date(top.getTime() - (SLOTS - 1 - i) * 3_600_000)
      .toISOString()
      .slice(0, 13) + ':00:00Z',
  )
}

/** Mini-sparkline: one bar per recorded hour; height = the share of
 *  that hour's scans that found the resident live. Full bar = never
 *  blinked, red stub = down the whole hour, faint tick = not probed. */
function MiniSpark({ buckets }: { buckets: ModuleHour[] }) {
  const byHour = new Map(buckets.map((b) => [b.hour, b]))
  const keys = hourKeys()
  const W = SLOTS * 13 + 4
  const BASE = 34
  const MAX_H = 28
  const recorded = keys.filter((k) => byHour.has(k))
  const neverBlinked = recorded.filter((k) => {
    const b = byHour.get(k)!
    return b.scans > 0 && b.live === b.scans
  }).length
  const latest = byHour.get(keys[keys.length - 1])

  const caption = recorded.length === 0
    ? 'no scan recorded for this resident in the last 24 hours'
    : `${recorded.length} of ${SLOTS} hours recorded · ${neverBlinked} never blinked`
    + (latest ? ` · this hour: ${latest.live} of ${latest.scans} probes live` : '')

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${BASE + 6}`}
        role="img"
        aria-label={`Liveness over the last ${SLOTS} hours, one bar per recorded hour.`}
        style={{ display: 'block', width: '100%', maxWidth: W, height: 'auto' }}
      >
        <line x1={2} y1={BASE + 0.5} x2={W - 2} y2={BASE + 0.5}
          style={{ stroke: 'var(--hairline-2)', strokeWidth: 1 }} />
        {keys.map((k, i) => {
          const x = 2 + i * 13
          const b = byHour.get(k)
          if (!b) {
            // unprobed hour: a faint tick so the gap itself is visible
            return <rect key={k} x={x + 3} y={BASE - 2} width={7} height={2}
              rx={1} style={{ fill: 'var(--text-faint)', fillOpacity: 0.35 }} />
          }
          const frac = b.scans > 0 ? b.live / b.scans : 0
          const h = Math.max(3, frac * MAX_H)
          const down = frac === 0
          return (
            <g key={k}>
              <title>{`${k} · ${b.live} of ${b.scans} probes live`}</title>
              <rect x={x + 1.5} y={BASE - h} width={10} height={h} rx={2}
                style={{ fill: down ? 'var(--danger)' : 'var(--success)', fillOpacity: down ? 0.9 : 0.55 + 0.45 * frac }} />
            </g>
          )
        })}
      </svg>
      <div className="trend-caption" aria-live="polite">{caption}</div>
    </>
  )
}

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const { data: mod } = useApi<Module>(`/api/modules/${moduleId}`, 15000)
  // The record changes once an hour, not every 15s — poll it slowly.
  const { data: spark, error: sparkError } = useApi<ModuleHour[]>(
    `/api/modules/${moduleId}/sparkline?hours=24`, 60000)
  const info = MODULE_INFO[moduleId ?? '']

  if (!mod) return <div className="page-head"><h1>Loading…</h1></div>
  if (mod.status === undefined && !info) return <div className="page-head"><h1>Unknown module</h1></div>

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Module</div>
        <h1><span className={mod.status === 'live' ? 'dot g' : 'dot r'} style={{ marginRight: 10 }} />{mod.name}</h1>
        <p className="sub">{info?.oneLine}</p>
      </div>

      <section>
        <div className="pills">
          <div className="pill"><div className={mod.status === 'live' ? 'v g' : 'v r'}>{mod.status}</div><div className="k">Status</div><div className="s">as of last scan</div></div>
          <div className="pill"><div className="v">{Object.keys(mod.data ?? {}).length}</div><div className="k">Reported fields</div><div className="s">from the live scanner</div></div>
        </div>
      </section>

      <section>
        <h2 className="sec">Liveness, last 24 hours</h2>
        <p className="sec-sub">
          One bar per UTC hour — height is the share of that hour's scans that found this
          resident live. A faint tick means no scan landed that hour; a red stub means the
          whole hour down. Measured every 30 seconds, never interpolated.
        </p>
        {spark ? <MiniSpark buckets={spark} />
          : sparkError ? <div className="empty">API unreachable — the record could not be read.</div>
          : <div className="empty">scanning…</div>}
      </section>

      <section>
        <h2 className="sec">What it is</h2>
        <p style={{ maxWidth: 720 }}>{info?.long ?? 'No description registered for this module yet.'}</p>
        {info?.lesson && <p className="muted" style={{ marginTop: 10 }}>Related reading: <a href={`/lessons${info.lesson}`}>the course</a></p>}
      </section>

      <section>
        <h2 className="sec">Live data</h2>
        <p className="sec-sub">Exactly what the scanner last observed, as raw JSON.</p>
        <pre className="kbd" style={{ display: 'block', padding: '12px 14px', whiteSpace: 'pre-wrap', maxWidth: 620 }}>
{JSON.stringify({ status: mod.status, ...(mod.data ?? {}) }, null, 2)}
        </pre>
      </section>
    </div>
  )
}
