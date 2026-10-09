import { useApi } from '../hooks/useApi'

type Module = { module_id: string; name: string; status: string; data: Record<string, unknown> }

// Generic software taxonomy — describes what each kind of resident IS.
// Which residents exist on a given host comes from the live API
// (configured host-side, never in the public repo).
export const MODULE_INFO: Record<string, { oneLine: string; long: string; lesson: string }> = {
  _default: { oneLine: 'A resident probed live by the scanner.', long: 'The scanner checks this resident every 30 seconds with a cheap probe — process table, local port, or container list — and records its state. A resident missing here simply has no probe configured for it.', lesson: '#lesson-3' },
  hermes: { oneLine: 'Agent runtime: gateway loop, lanes, memory files, tools.', long: 'An agent runtime keeps a long-lived gateway process that receives messages, routes them to named lanes, builds context from memory and files, calls a model API, executes tools locally, and replies. Its memory and skills are plain files that survive restarts — state on disk, read back each wake-up.', lesson: '#lesson-2' },
  openclaw: { oneLine: 'Second agent runtime with its own gateway, sessions, and model routing.', long: 'A separate agent process with its own lane configuration and session store. Running two agent runtimes side by side demonstrates isolation by identity: separate processes, separate histories, separate credentials files, one kernel between them.', lesson: '#lesson-2' },
  opencode: { oneLine: 'Shared CLI coding engine that other agents can invoke.', long: 'A terminal-first coding agent: reads a repo, proposes edits, runs tests, and records its sessions to a shared database. An engine rather than a persona — several drivers can use one engine, and usage stays auditable because every session lands on disk.', lesson: '#lesson-2' },
  ollama: { oneLine: 'Local model server: embeddings and small models without leaving the box.', long: 'Ollama serves models over a local HTTP API. Anything routed through it never leaves the machine: embeddings for search, small utility models, offline fallbacks. RAM is the budget here, so it hosts what fits, not everything.', lesson: '#lesson-3' },
  docker: { oneLine: 'Container runtime: each service wrapped with its dependencies.', long: 'Docker gives each service its own filesystem view and network entry, with restart policies and a blast radius limited to the container when things break. The heavier stack — databases, queues, workflow engines — runs inside containers so a dependency upgrade cannot silently break the host.', lesson: '#lesson-4' },
  temporal: { oneLine: 'Durable workflow engine: multi-step jobs with retries and state.', long: 'A workflow engine stores job state in its own database, so a long multi-step task survives crashes: if a worker dies mid-task, the workflow resumes where it left off. The difference between "hope the script finishes" and "the engine guarantees progress".', lesson: '#lesson-6' },
  postiz: { oneLine: 'Queue-backed publisher: work that waits for its moment.', long: 'A scheduler holds pending jobs in a queue (redis) and their records in a database (Postgres), then acts on schedule. A good example of a service that spends most of its life idle, waiting on a queue, yet must never lose in-flight work.', lesson: '#lesson-6' },
  minisite: { oneLine: 'Static HTTP server — the simplest service on any box.', long: 'One process, one directory, one port: it serves HTML files over HTTP to a browser. Deliberately boring, and therefore the best first example: most one-off apps on a server are just files in a directory behind a tiny server.', lesson: '#lesson-3' },
  cron: { oneLine: 'The scheduler. Timed jobs: digests, refreshes, health checks.', long: 'Cron is the oldest automation on any Unix box: a table of schedules and commands. When something happens on this machine "every hour at :05", it happens here. Simple, persistent, and visible in the process table.', lesson: '#lesson-3' },
}

export default function Modules() {
  const { data, error } = useApi<Module[]>('/api/modules/', 15000)
  const live = (data ?? []).filter((mm) => mm.status === 'live')

  return (
    <div>
      <div className="page-head">
        <h1>Modules</h1>
        <p className="sub">
          The residents of this machine, with their live status. {' '}
          {data ? <span className="live-label">● {live.length} of {data.length} live · rescanned {error ? 'unavailable' : 'every 15s'}</span> : 'loading…'}
        </p>
      </div>

      <div className="card-grid" style={{ marginTop: 18 }}>
        {(data ?? []).map((mm) => {
          const info = MODULE_INFO[mm.module_id] ?? MODULE_INFO._default
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
        {error && <div className="empty">API unreachable — is the backend serving?</div>}
      </div>
    </div>
  )
}
