import { useApi } from '../hooks/useApi'

type Service = { port: number; name: string }
type Module = { module_id: string; name: string; status: string }

function Node({ name, sub, accent, live }: { name: string; sub?: string; accent?: string; live?: boolean | null }) {
  return (
    <div className={`node ${accent ? `accent-${accent}` : ''}`}>
      <div className="n-name">{live !== undefined && <span className={live ? 'dot g' : 'dot r'} style={{ marginRight: 7 }} />}{name}</div>
      {sub && <div className="n-sub">{sub}</div>}
    </div>
  )
}

export default function Architecture() {
  const { data: services } = useApi<Service[]>('/api/services/')
  const { data: modules } = useApi<Module[]>('/api/modules/')
  const ports = new Set((services ?? []).map((s) => s.port))
  const mod = (id: string) => (modules ?? []).find((m) => m.module_id === id)?.status === 'live'

  return (
    <div>
      <div className="page-head">
        <h1>Architecture</h1>
        <p className="sub">Five tiers, top to bottom. Green dots are live right now — pulled from the scanner, not drawn from memory.</p>
      </div>

      <div className="diagram" style={{ marginTop: 18 }}>
        <div className="diagram-title">thehost · {services ? `${services.length} listeners` : 'scanning…'}</div>
        <div className="diagram-sub">data sources on top · storage on the bottom · everything in between is a process</div>

        <div className="tier">
          <div className="tier-label">Access — outside world</div>
          <div className="tier-row">
            <Node name="Telegram" sub="Bot API · users" accent="x" live={null} />
            <Node name="Browser" sub="you, right now" accent="x" live={null} />
            <Node name="SSH :22" sub="operator" accent="x" live={ports.has(22)} />
            <Node name="Model APIs" sub="rented reasoning" accent="x" live={null} />
          </div>
        </div>

        <div className="flow-row"><span className="arrow">↓</span><span className="arrow" style={{ marginLeft: 60 }}>↓</span><span className="arrow" style={{ marginLeft: 60 }}>↓</span></div>

        <div className="tier">
          <div className="tier-label">Agents — the players</div>
          <div className="tier-row">
            <Node name="Hermes" sub="gateway · memory · skills" accent="s" live={mod('hermes')} />
            <Node name="OpenClaw" sub=":18789 · Philip" accent="s" live={mod('openclaw')} />
            <Node name="OpenCode" sub="shared coding engine" accent="s" live={mod('opencode')} />
            <Node name="Pi" sub="minimal lane" accent="s" live={null} />
          </div>
        </div>

        <div className="flow-row"><span className="arrow">↓</span></div>

        <div className="tier">
          <div className="tier-label">Runtime — how things stay alive</div>
          <div className="tier-row">
            <Node name="systemd" sub="services + user units" accent="w" live={null} />
            <Node name="Docker" sub="containers" accent="w" live={mod('docker')} />
            <Node name="Cron" sub="schedules" accent="w" live={mod('cron')} />
            <Node name="Ollama" sub=":11434 local models" accent="w" live={mod('ollama')} />
          </div>
        </div>

        <div className="flow-row"><span className="arrow">↓</span></div>

        <div className="tier">
          <div className="tier-label">Apps — surfaces you open</div>
          <div className="tier-row">
            <Node name="web-app" sub=":8090 coding-1" accent="i" live={ports.has(8090)} />
            <Node name="research-app" sub=":8091 coding-2" accent="i" live={ports.has(8091)} />
            <Node name="VPS Anatomy" sub=":8093 this app" accent="i" live={ports.has(8093)} />
            <Node name="Mini-sites" sub=":8080 dashboards" accent="i" live={ports.has(8080)} />
            <Node name="desk-app" sub=":3080" accent="i" live={ports.has(3080)} />
          </div>
        </div>

        <div className="flow-row"><span className="arrow">↓</span></div>

        <div className="tier">
          <div className="tier-label">Storage — what persists</div>
          <div className="tier-row">
            <Node name="Git repos" sub="code + history" accent="p" live={null} />
            <Node name="sqlite" sub="sessions · scanner" accent="p" live={null} />
            <Node name="Postgres / Redis" sub="via Docker" accent="p" live={null} />
            <Node name="Markdown" sub="memory · skills" accent="p" live={null} />
            <Node name="Secrets" sub="env · 700 perms" accent="p" live={null} />
          </div>
        </div>
      </div>

      <div className="seealso">
        See also: <a href="/signal-flow">Signal Flow</a> · <a href="/data-flow">Data Flow</a> · <a href="/modules">Modules</a>
      </div>
    </div>
  )
}
