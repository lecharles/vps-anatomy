import { useApi } from '../hooks/useApi'

type Module = { module_id: string; name: string; status: string; data: Record<string, unknown> }

export const MODULE_INFO: Record<string, { oneLine: string; long: string; lesson: string }> = {
  hermes: { oneLine: 'General-purpose agent runtime. Writes code, runs commands, keeps memory files, answers Telegram.', long: 'Hermes runs as its own gateway loop on this box: a long-lived process that receives Telegram updates, routes them to lanes, calls a model API with built context, executes tools locally (terminal, files, browser) and replies back. It maintains persistent memory and skill markdown files that survive restarts.', lesson: '#lesson-2' },
  openclaw: { oneLine: 'The primary personal assistant agent ("Philip"). Owns its session store and model calls.', long: 'OpenClaw is the second agent runtime on the machine, with its own gateway, session history and model routing. It handles the daily-assistant lanes and records exact token usage per call — the numbers behind the usage dashboard.', lesson: '#lesson-2' },
  opencode: { oneLine: 'Shared coding engine. Both agents can invoke it for terminal-first development work.', long: 'OpenCode is a CLI coding agent: reads a repo, proposes and applies edits, runs tests. It persists assistant messages in a shared sqlite store, which makes its usage auditable. Think of it as an engine more than a persona — drivers plug into it.', lesson: '#lesson-2' },
  ollama: { oneLine: 'Local model runtime on :11434 for embeddings and small models — reasoning without leaving the box.', long: 'Ollama serves models locally over an HTTP API on port 11434. Anything routed through it never leaves the machine: embeddings for search, small utility models, offline fallbacks. RAM is the budget here, so it hosts what fits, not everything.', lesson: '#lesson-3' },
  docker: { oneLine: 'Container runtime wrapping services with dependencies: databases, queues, workflow engines.', long: 'Docker gives each service its own filesystem view and network entry. The heavyweight stack — Temporal and its Postgres/Elasticsearch, Postiz and its Redis — runs inside containers, so a dependency upgrade can\'t silently break the host.', lesson: '#lesson-4' },
  temporal: { oneLine: 'Durable workflow engine: multi-step agent jobs with retries and state.', long: 'Temporal stores workflow state in its own Postgres and lets long, multi-step jobs survive crashes: if a worker dies mid-task, the workflow resumes where it left off. It\'s the difference between "hope the script finishes" and "the engine guarantees progress".', lesson: '#lesson-6' },
  postiz: { oneLine: 'Social scheduler: queues and publishes content to X, LinkedIn and more.', long: 'Postiz holds a post queue in Redis and its data in Postgres, then publishes to social APIs on schedule. A good example of a service that spends most of its life idle — waiting on a queue — yet must never lose in-flight work.', lesson: '#lesson-6' },
  minisite: { oneLine: 'Static HTTP server on :8080 — where dashboards and mini-sites live, including this app\'s sibling.', long: 'The mini-site server is deliberately boring: it serves HTML files over HTTP to your browser. The usage/token dashboard you may already know lives here. Most of a fleet of one-off apps on this box are just files in a directory.', lesson: '#lesson-3' },
  cron: { oneLine: 'The scheduler. Timed jobs: hourly dashboard regeneration, digests, health checks.', long: 'Cron is the oldest automation on any Unix box: a table of schedules and commands. The dashboards you see refresh because cron told them to at :05 every hour. When something happens "on schedule" on this machine, it happens here.', lesson: '#lesson-3' },
}

export default function Modules() {
  const { data, error } = useApi<Module[]>('/api/modules/', 15000)
  const live = (data ?? []).filter((mm) => mm.status === 'live')

  return (
    <div>
      <div className="page-head">
        <h1>Modules</h1>
        <p className="sub">
          The residents of the machine, with their live status. {' '}
          {data ? <span className="live-label">● {live.length} of {data.length} live · rescanned {error ? 'unavailable' : 'every 15s'}</span> : 'loading…'}
        </p>
      </div>

      <div className="card-grid" style={{ marginTop: 18 }}>
        {(data ?? []).map((mm) => {
          const info = MODULE_INFO[mm.module_id] ?? { oneLine: '', long: '', lesson: '/lessons' }
          return (
            <a className="card" key={mm.module_id} href={`/modules/${mm.module_id}`}>
              <h3>
                <span className={mm.status === 'live' ? 'dot g' : 'dot r'} />
                {mm.name}
              </h3>
              <p className="desc">{info.oneLine}</p>
              <div className="card-foot">
                <span className={mm.status === 'live' ? 'chip live' : 'chip stopped'}>{mm.status}</span>
                {mm.data && Object.keys(mm.data).length > 0 && (
                  <span className="chip mono">{Object.entries(mm.data).slice(0, 2).map(([k, v]) => `${k}=${Array.isArray(v) ? v.length : v}`).join(' · ')}</span>
                )}
              </div>
            </a>
          )
        })}
        {!data && !error && <div className="empty">First scan pending…</div>}
        {error && <div className="empty">API unreachable — is the backend on :8093?</div>}
      </div>
    </div>
  )
}
