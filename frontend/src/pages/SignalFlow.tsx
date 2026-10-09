import { useApi } from '../hooks/useApi'

type Module = { module_id: string; status: string }

export default function SignalFlow() {
  const { data: modules } = useApi<Module[]>('/api/modules/', 15000)
  const hermesLive = (modules ?? []).find((m) => m.module_id === 'hermes')?.status === 'live'

  const steps = [
    { n: '01', title: 'Message', sub: 'Telegram Bot API push', tone: 'x' },
    { n: '02', title: 'Gateway', sub: 'route to a lane', tone: 's' },
    { n: '03', title: 'Context', sub: 'memory + files + history', tone: 's' },
    { n: '04', title: 'Model call', sub: 'HTTPS · rented reasoning', tone: 'w' },
    { n: '05', title: 'Tools', sub: 'terminal · files · browser', tone: 'i' },
    { n: '06', title: 'Reply', sub: 'back down the same path', tone: 'x' },
  ]
  const toneClass: Record<string, string> = { x: 'accent-x', s: 'accent-s', w: 'accent-w', i: 'accent-i' }

  return (
    <div>
      <div className="page-head">
        <h1>Signal Flow</h1>
        <p className="sub">One message, end to end: from a phone, through this machine, and back. Reasoning is rented over HTTPS — tools, memory and consequences are local.</p>
      </div>

      <div className="diagram" style={{ marginTop: 18 }}>
        <div className="diagram-title">The loop</div>
        <div className="diagram-sub">{hermesLive ? '● both agent gateways are listening — this path is live right now' : 'scanning gateways…'}</div>
        <div className="flow-row">
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`node ${toneClass[s.tone]}`} style={{ minWidth: 130 }}>
                <div className="n-sub" style={{ color: 'var(--primary-bright)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.n}</div>
                <div className="n-name">{s.title}</div>
                <div className="n-sub">{s.sub}</div>
              </div>
              {i < steps.length - 1 && <span className="arrow">→</span>}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 11.5, marginTop: 10 }}>
          04 is the only hop that leaves the machine · everything else happens on this box
        </div>
      </div>

      <section>
        <div className="eyebrow">Read it carefully</div>
        <div className="rows">
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>01 → 02</span><span className="detail">Telegram delivers an update to the gateway process. The agent was asleep in a loop; the network wakes it.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>02 → 03</span><span className="detail">The lane's context is assembled: recent turns, memory files, skills, file paths. Context is retrieved, not magical.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>03 → 04</span><span className="detail">One HTTPS request to a model API. This is the rented half of the agent — stateless, remote, priced by token.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>04 → 05</span><span className="detail">The model asks for a tool; the agent executes it locally. The box's real power is here — this is where care (and Lesson 4) matters.</span></div>
          <div className="row"><span className="name mono" style={{ color: 'var(--primary-bright)' }}>05 → 06</span><span className="detail">Tool output is appended to context and the loop repeats until the model replies. The answer walks back down the chain.</span></div>
        </div>
      </section>

      <p className="seealso">See also: <a href="/data-flow">Data Flow (what this writes)</a> · <a href="/architecture">Architecture</a> · <a href="/lessons#lesson-5">Lesson 5</a></p>
    </div>
  )
}
