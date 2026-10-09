import { useApi, relTime } from '../hooks/useApi'

type Change = {
  id: number; timestamp: string; change_type: string
  entity_type: string; entity_id: string; description: string
}

const TYPE_CLASS: Record<string, string> = {
  service_started: 'started', module_started: 'started',
  service_stopped: 'stopped', module_stopped: 'stopped',
  module_updated: 'updated', machine_changed: 'updated',
}
const TYPE_LABEL: Record<string, string> = {
  service_started: 'up', service_stopped: 'down',
  module_started: 'live', module_stopped: 'stopped',
  module_updated: 'update', machine_changed: 'change',
}

function dayLabel(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  const today = new Date()
  const yest = new Date(Date.now() - 86400000)
  const f = (x: Date) => x.toDateString()
  if (f(d) === f(today)) return 'Today'
  if (f(d) === f(yest)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Changes() {
  const { data: changes, error } = useApi<Change[]>('/api/changes/?limit=100', 10000)
  const list = changes ?? []

  const last24 = list.filter((c) => Date.now() - new Date(c.timestamp + (c.timestamp.endsWith('Z') ? '' : 'Z')).getTime() < 86400000)
  const ups = last24.filter((c) => (TYPE_CLASS[c.change_type] ?? '') === 'started').length
  const downs = last24.filter((c) => (TYPE_CLASS[c.change_type] ?? '') === 'stopped').length

  const groups: { day: string; items: Change[] }[] = []
  for (const c of list) {
    const day = dayLabel(c.timestamp)
    const g = groups[groups.length - 1]
    if (g && g.day === day) g.items.push(c)
    else groups.push({ day, items: [c] })
  }

  return (
    <div>
      <div className="page-head">
        <h1>Changes</h1>
        <p className="sub">The machine's diary: every listener that appeared or disappeared, every module that flipped state. Written by the scanner, not by hand.</p>
      </div>

      <div className="pills">
        <div className="pill"><div className="v">{list.length}</div><div className="k">Events recorded</div><div className="s">since the scanner started</div></div>
        <div className="pill"><div className="v g">+{ups}</div><div className="k">Started · 24h</div></div>
        <div className="pill"><div className="v r">−{downs}</div><div className="k">Stopped · 24h</div></div>
        <div className="pill"><div className="v p">{groups.length}</div><div className="k">Active days</div></div>
      </div>

      {groups.map((g) => (
        <section key={g.day}>
          <div className="eyebrow">{g.day} · {g.items.length} event{g.items.length === 1 ? '' : 's'}</div>
          <div className="feed">
            {g.items.map((c) => (
              <div className="feed-item" key={c.id}>
                <span className="f-dot" style={{ background: (TYPE_CLASS[c.change_type] ?? '') === 'started' ? 'var(--success)' : (TYPE_CLASS[c.change_type] ?? '') === 'stopped' ? 'var(--danger)' : 'var(--warning)' }} />
                <div className="f-body">
                  <div className="f-desc">{c.description}</div>
                  <div className="f-meta">{relTime(c.timestamp)} · {c.entity_type}/{c.entity_id}</div>
                </div>
                <span className={`f-type ${TYPE_CLASS[c.change_type] ?? 'updated'}`}>{TYPE_LABEL[c.change_type] ?? c.change_type}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {list.length === 0 && !error && (
        <div className="feed" style={{ marginTop: 18 }}>
          <div className="empty"><span className="pulse" />The scanner is watching. A quiet machine is a healthy machine — events will appear here when anything starts, stops or changes.</div>
        </div>
      )}
      {error && <div className="feed" style={{ marginTop: 18 }}><div className="empty">API unreachable.</div></div>}

      <p className="seealso">How this works: <a href="/lessons#lesson-6">Lesson 6</a> · <a href="/modules">Modules</a></p>
    </div>
  )
}
