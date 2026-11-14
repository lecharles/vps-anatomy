import { useApi } from '../hooks/useApi'

type Module = { module_id: string; status: string }
type Service = { port: number; name: string; public: boolean }
type Hop = { port: number; connect_ms: number | null; ok: boolean; probes: number; hits: number }

// S14b: median of the measured loopback handshakes, computed client-side
// from the same scan that feeds every other number on this page.
function median(nums: number[]): number | null {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const fmtMs = (v: number) => `${v < 1 ? v.toFixed(3) : v.toFixed(2)} ms`

const ACCENTS: Record<string, string> = {
  x: 'var(--purple)',
  s: 'var(--success)',
  w: 'var(--warning)',
  i: 'var(--info)',
}

const STEPS = [
  { n: '01', title: 'Message', sub: 'Telegram push', tone: 'x' },
  { n: '02', title: 'Gateway', sub: 'route to lane', tone: 's' },
  { n: '03', title: 'Context', sub: 'memory + history', tone: 's' },
  { n: '04', title: 'Model call', sub: 'HTTPS request', tone: 'w' },
  { n: '05', title: 'Tools', sub: 'terminal · files', tone: 'i' },
  { n: '06', title: 'Reply', sub: 'back to chat', tone: 'x' },
]

// layout
const VBW = 1000
const NW = 138
const NH = 66
const GAPX = (VBW - 40 - 6 * NW) / 5
const NY = 46

export default function SignalFlow() {
  const { data: modules } = useApi<Module[]>('/api/modules/', 15000)
  const hermesLive = (modules ?? []).find((m) => m.module_id === 'hermes')?.status === 'live'

  // S14b: the measured hops. Ports are joined to names at read time from
  // /api/services/ — nothing about this machine's residents lives in code.
  const { data: hops } = useApi<Hop[]>('/api/latency/', 15000)
  const { data: services } = useApi<Service[]>('/api/services/', 15000)
  const answered = (hops ?? []).filter((h) => h.ok && h.connect_ms != null)
  const ms = answered.map((h) => h.connect_ms as number)
  const med = median(ms)
  const slowest = ms.length ? Math.max(...ms) : null
  const selfPort = Number(window.location.port) || NaN
  const selfHop = answered.find((h) => h.port === selfPort) ?? null
  const nameOf = (p: number) => (services ?? []).find((s) => s.port === p)?.name ?? `port :${p}`

  const x = (i: number) => 20 + i * (NW + GAPX)
  const cx = (i: number) => x(i) + NW / 2

  return (
    <div>
      <div className="page-head">
        <h1>Signal Flow</h1>
        <p className="sub">One message, end to end. Step 04 is the only hop that leaves the server — model calls go out over HTTPS, everything else runs locally. 'Local' is now timed, not promised: the loopback handshakes below come from the same scan that feeds every other page.</p>
      </div>

      <div className="diagram" style={{ marginTop: 18 }}>
        <div className="diagram-sub" style={{ marginBottom: 12 }}>
          {hermesLive ? '● gateway is listening — this path is live right now' : 'scanning gateways…'}
        </div>
        <svg viewBox={`0 0 ${VBW} 190`} role="img" aria-label="Signal flow pipeline" style={{ display: 'block', width: '100%', height: 'auto' }}>
          <defs>
            <marker id="sig-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" style={{ fill: 'none', stroke: 'var(--text-faint)', strokeWidth: 1.2 }} />
            </marker>
          </defs>

          {/* external boundary around step 04 */}
          <rect x={x(3) - 10} y={NY - 14} width={NW + 20} height={NH + 28} rx={11}
            style={{ fill: 'none', stroke: 'var(--warning)', strokeOpacity: 0.55, strokeWidth: 1.2, strokeDasharray: '5 4' }} />
          <text x={cx(3)} y={NY - 20} textAnchor="middle"
            style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', letterSpacing: '1px', fill: 'var(--text-faint)' }}>OFF-SERVER</text>

          {/* forward arrows */}
          {STEPS.slice(0, -1).map((_, i) => (
            <line key={i} x1={x(i) + NW + 3} y1={NY + NH / 2} x2={x(i + 1) - 5} y2={NY + NH / 2}
              style={{ stroke: 'var(--text-faint)', strokeWidth: 1.3, strokeOpacity: 0.7 }} markerEnd="url(#sig-arr)" />
          ))}

          {/* tool loop: 05 back into the model-call round trip */}
          <path d={`M ${cx(4)} ${NY + NH} L ${cx(4)} ${NY + NH + 34}
                    L ${cx(3)} ${NY + NH + 34} L ${cx(3)} ${NY + NH + 12}`}
            style={{ fill: 'none', stroke: 'var(--info)', strokeOpacity: 0.7, strokeWidth: 1.3, strokeDasharray: '4 3' }}
            markerEnd="url(#sig-arr)" />
          <text x={(cx(3) + cx(4)) / 2} y={NY + NH + 30} textAnchor="middle"
            style={{ fontSize: 9.5, fill: 'var(--text-muted)' }}>tool output → next model call</text>

          {/* nodes */}
          {STEPS.map((s, i) => {
            const stroke = ACCENTS[s.tone] ?? 'var(--hairline-2)'
            return (
              <g key={s.n}>
                <rect x={x(i)} y={NY} width={NW} height={NH} rx={8}
                  style={{ fill: 'var(--surface-elevated)', stroke, strokeOpacity: 0.6, strokeWidth: 1.2 }} />
                <text x={x(i) + 12} y={NY + 18}
                  style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', fill: 'var(--primary-bright)' }}>{s.n}</text>
                <text x={x(i) + NW / 2} y={NY + 38} textAnchor="middle"
                  style={{ fontSize: 12.5, fontWeight: 600, fill: 'var(--text-bright)' }}>{s.title}</text>
                <text x={x(i) + NW / 2} y={NY + 53} textAnchor="middle"
                  style={{ fontSize: 9.5, fill: 'var(--text-muted)' }}>{s.sub}</text>
              </g>
            )
          })}
        </svg>
        {answered.length > 0 && (
          <div className="diagram-sub" style={{ marginTop: 12 }}>
            measured, not promised: last scan timed {answered.length} of {hops!.length} loopback
            handshakes · median {med != null ? fmtMs(med) : '—'} · slowest{' '}
            {slowest != null ? fmtMs(slowest) : '—'}
            {selfHop && selfHop.connect_ms != null ? (
              <> · this dashboard timed itself at {fmtMs(selfHop.connect_ms)}</>
            ) : null}
          </div>
        )}
      </div>

      {answered.length > 0 && (
        <section>
          <div className="eyebrow">Every local hop, timed</div>
          <div className="rows">
            {answered.map((h) => (
              <div className="row" key={h.port}>
                <span className="name mono" style={{ color: 'var(--primary-bright)' }}>
                  {nameOf(h.port)} :{h.port}
                </span>
                <span className="detail">
                  median handshake {fmtMs(h.connect_ms as number)} · {h.hits} of {h.probes} probes answered
                  {' · '}
                  <a href="/api/latency/history" style={{ textDecoration: 'none' }}>history ↗</a>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="eyebrow">Hop by hop</div>
        <div className="rows">
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>01 → 02</span><span className="detail">Telegram delivers an update to the gateway process. The gateway is a long-running loop; a message starts it working.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>02 → 03</span><span className="detail">The lane's context is assembled: recent turns, memory files, skills, file paths. Context is retrieved from disk, not invented.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>03 → 04</span><span className="detail">One HTTPS request to a model API: stateless, remote, priced by token. This is the only hop that leaves the server.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>04 → 05</span><span className="detail">The model asks for a tool; the agent executes it locally: terminal, file, browser. This is where Lesson 4 (permissions) matters most.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>05 → 06</span><span className="detail">Tool output is appended to context and the loop repeats until the model replies. The answer travels back to the chat.</span></div>
        </div>
      </section>

      <p className="seealso">See also: <a href="/data-flow">Data Flow (what this writes)</a> · <a href="/architecture">Architecture</a> · <a href="/lessons#lesson-5">Lesson 5</a></p>
    </div>
  )
}
