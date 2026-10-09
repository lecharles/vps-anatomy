type Lane = { name: string; sub: string }
type Msg = { from: number; to: number; label: string; ret?: boolean }

const LANES: Lane[] = [
  { name: 'Telegram', sub: 'user' },
  { name: 'Gateway', sub: 'lane router' },
  { name: 'Agent', sub: 'runtime' },
  { name: 'Model API', sub: 'remote · HTTPS' },
  { name: 'Disk', sub: 'stores · git' },
]

const MESSAGES: Msg[] = [
  { from: 0, to: 1, label: 'new message (update)' },
  { from: 1, to: 2, label: 'route to lane + build context' },
  { from: 4, to: 2, label: 'memory · skills · history', ret: true },
  { from: 2, to: 3, label: 'prompt → completion request' },
  { from: 3, to: 2, label: 'reply · or tool call', ret: true },
  { from: 2, to: 4, label: 'execute tool · read/write files' },
  { from: 4, to: 2, label: 'tool output', ret: true },
  { from: 2, to: 4, label: 'log turn (session JSONL)' },
  { from: 2, to: 1, label: 'final answer' },
  { from: 1, to: 0, label: 'message sent', ret: true },
]

export default function DataFlow() {
  const W = 980, H = 540, TOP = 70, ROW = 46
  const x = (i: number) => 95 + i * ((W - 190) / (LANES.length - 1))

  return (
    <div>
      <div className="page-head">
        <h1>Data Flow</h1>
        <p className="sub">The same path as Signal Flow, drawn vertically: each column is a component, each arrow a call. Blue is a call, green dashed is a return. The right-hand crossings are the ones that leave bytes on disk.</p>
      </div>

      <div className="diagram" style={{ marginTop: 18 }}>
        <svg className="seq" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Data flow sequence diagram">
          <defs>
            <marker id="arr-call" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" style={{ fill: 'none', stroke: 'var(--primary-bright)', strokeWidth: 1.2 }} />
            </marker>
            <marker id="arr-ret" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" style={{ fill: 'none', stroke: 'var(--success)', strokeWidth: 1.2 }} />
            </marker>
          </defs>

          {LANES.map((l, i) => (
            <g key={l.name}>
              <rect className="lane-box" x={x(i) - 62} y={14} width={124} height={36} rx={7} />
              <text className="lane-head" x={x(i)} y={31} textAnchor="middle">{l.name}</text>
              <text className="lane-sub" x={x(i)} y={44} textAnchor="middle">{l.sub}</text>
              <line className="lifeline" x1={x(i)} y1={56} x2={x(i)} y2={H - 16} />
            </g>
          ))}

          {MESSAGES.map((m, i) => {
            const y = TOP + i * ROW + 14
            const x1 = x(m.from), x2 = x(m.to)
            const mid = (x1 + x2) / 2
            const lw = m.label.length * 6.1 + 14
            return (
              <g key={i}>
                <line
                  x1={x1} y1={y} x2={x2 + (x2 > x1 ? -3 : 3)} y2={y}
                  style={{
                    stroke: m.ret ? 'var(--success)' : 'var(--primary-bright)',
                    strokeWidth: 1.4,
                    strokeDasharray: m.ret ? '4 3' : undefined,
                  }}
                  markerEnd={m.ret ? 'url(#arr-ret)' : 'url(#arr-call)'}
                />
                <rect x={mid - lw / 2} y={y - 14} width={lw} height={13} rx={3} style={{ fill: 'var(--panel)' }} />
                <text className="msg-label" x={mid} y={y - 4} textAnchor="middle">{m.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <section>
        <div className="eyebrow">What each crossing writes</div>
        <div className="rows">
          <div className="row"><span className="name mono" style={{ fontSize: 12 }}>Gateway → Agent</span><span className="detail">the lane's conversation file gains a turn. Append-only: history is never rewritten.</span></div>
          <div className="row"><span className="name mono" style={{ fontSize: 12 }}>Agent ↔ Model API</span><span className="detail">tokens in, tokens out — logged with exact counts. That log is what usage dashboards read.</span></div>
          <div className="row"><span className="name mono" style={{ fontSize: 12 }}>Agent → Disk</span><span className="detail">every tool call touches disk: files edited, commands captured, sqlite rows committed. This scanner's own database is one of them.</span></div>
          <div className="row"><span className="name mono" style={{ fontSize: 12 }}>Agent → Memory</span><span className="detail">the deliberate write: a memory markdown file updated so the next session starts with it.</span></div>
        </div>
      </section>

      <p className="seealso">See also: <a href="/signal-flow">Signal Flow</a> · <a href="/changes">Changes</a> · <a href="/lessons#lesson-6">Lesson 6</a></p>
    </div>
  )
}
