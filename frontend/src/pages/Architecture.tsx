import { useApi } from '../hooks/useApi'

type Service = { port: number; name: string }
type Module = { module_id: string; status: string }

type NodeDef = { name: string; sub?: string; live?: boolean | null; accent: string }

const ACCENTS: Record<string, string> = {
  x: 'var(--purple)',
  s: 'var(--success)',
  w: 'var(--warning)',
  i: 'var(--info)',
  p: 'var(--coral)',
  n: 'var(--primary)',
}

// layout (viewBox units)
const VBW = 1000
const BAND_X = 20
const BAND_W = VBW - 40
const BAND_PAD_X = 16
const NODE_H = 58
const NODE_GAP = 12
const LABEL_H = 26
const BAND_H = LABEL_H + NODE_H + 16
const GAP = 24
const Y0 = 6

function Tier({ y, label, right, nodes }: { y: number; label: string; right?: string; nodes: NodeDef[] }) {
  const n = Math.max(nodes.length, 1)
  const nodeW = (BAND_W - 2 * BAND_PAD_X - (n - 1) * NODE_GAP) / n
  const ny = y + LABEL_H
  return (
    <g>
      <rect x={BAND_X} y={y} width={BAND_W} height={BAND_H} rx={10} style={{ fill: 'none', stroke: 'var(--hairline-2)', strokeOpacity: 0.55 }} />
      <text x={BAND_X + 14} y={y + 16} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.4px', fill: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{label.toUpperCase()}</text>
      {right && (
        <text x={BAND_X + BAND_W - 14} y={y + 16} textAnchor="end" style={{ fontSize: 10, fill: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{right}</text>
      )}
      {nodes.map((node, i) => {
        const nx = BAND_X + BAND_PAD_X + i * (nodeW + NODE_GAP)
        const stroke = ACCENTS[node.accent] ?? 'var(--hairline-2)'
        const cy = ny + NODE_H / 2
        return (
          <g key={node.name + i}>
            <rect x={nx} y={ny} width={nodeW} height={NODE_H} rx={8}
              style={{ fill: 'var(--surface-elevated)', stroke, strokeOpacity: 0.6, strokeWidth: 1.2 }} />
            {node.live !== undefined && node.live !== null && (
              <circle cx={nx + 11} cy={cy} r={3.5} style={{ fill: node.live ? 'var(--success)' : 'var(--danger)' }} />
            )}
            <text x={nx + nodeW / 2} y={node.sub ? cy - 2 : cy + 4} textAnchor="middle"
              style={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-bright)' }}>{node.name}</text>
            {node.sub && (
              <text x={nx + nodeW / 2} y={cy + 14} textAnchor="middle"
                style={{ fontSize: 9.5, fill: 'var(--text-muted)' }}>{node.sub}</text>
            )}
          </g>
        )
      })}
    </g>
  )
}

function Connector({ y }: { y: number }) {
  return (
    <line x1={VBW / 2} y1={y} x2={VBW / 2} y2={y + GAP - 9}
      style={{ stroke: 'var(--text-faint)', strokeWidth: 1.2, strokeOpacity: 0.6 }}
      markerEnd="url(#arch-arr)" />
  )
}

export default function Architecture() {
  const { data: services } = useApi<Service[]>('/api/services/')
  const { data: modules } = useApi<Module[]>('/api/modules/')
  const ports = new Set((services ?? []).map((s) => s.port))
  const mod = (id: string) => (modules ?? []).find((m) => m.module_id === id)?.status === 'live'

  const apps: NodeDef[] = (services ?? [])
    .filter((s) => s.port >= 3000 && s.port <= 9999 && ![3306, 5432, 6379, 9090, 9200].includes(s.port))
    .sort((a, b) => a.port - b.port)
    .slice(0, 6)
    .map((s) => ({ name: s.name, sub: `:${s.port}`, accent: 'i', live: ports.has(s.port) }))
  if (apps.length === 0) apps.push({ name: services ? 'none in range' : 'scanning…', accent: 'i', live: false })

  const tiers: { label: string; right?: string; nodes: NodeDef[] }[] = [
    {
      label: 'Access — outside world',
      nodes: [
        { name: 'Telegram', sub: 'Bot API · users', accent: 'x' },
        { name: 'Browser', sub: 'you, right now', accent: 'x' },
        { name: 'SSH :22', sub: 'operator', accent: 'x', live: ports.has(22) },
        { name: 'Model APIs', sub: 'remote inference', accent: 'x' },
      ],
    },
    {
      label: 'Agents',
      nodes: [
        { name: 'Hermes', sub: 'gateway · memory · skills', accent: 's', live: mod('hermes') },
        { name: 'OpenClaw', sub: 'assistant runtime', accent: 's', live: mod('openclaw') },
        { name: 'OpenCode', sub: 'shared coding engine', accent: 's', live: mod('opencode') },
        { name: 'Pi', sub: 'minimal lane', accent: 's' },
      ],
    },
    {
      label: 'Runtime — keeps everything alive',
      nodes: [
        { name: 'systemd', sub: 'services + user units', accent: 'w' },
        { name: 'Docker', sub: 'containers', accent: 'w', live: mod('docker') },
        { name: 'Cron', sub: 'schedules', accent: 'w', live: mod('cron') },
        { name: 'Ollama', sub: ':11434 local models', accent: 'w', live: mod('ollama') },
      ],
    },
    {
      label: 'Apps — HTTP surfaces',
      right: services ? `${services.length} listeners live` : 'scanning…',
      nodes: apps,
    },
    {
      label: 'Storage — what persists',
      nodes: [
        { name: 'Git repos', sub: 'code + history', accent: 'p' },
        { name: 'sqlite', sub: 'sessions · scanner', accent: 'p' },
        { name: 'Postgres · Redis', sub: 'via Docker', accent: 'p' },
        { name: 'Markdown', sub: 'memory · skills', accent: 'p' },
        { name: 'Secrets', sub: 'env · 700 perms', accent: 'p' },
      ],
    },
  ]

  const H = Y0 + tiers.length * BAND_H + (tiers.length - 1) * GAP + 6

  return (
    <div>
      <div className="page-head">
        <h1>Architecture</h1>
        <p className="sub">Five tiers, top to bottom. Dots show what is listening right now, read from the scanner.</p>
      </div>

      <div className="diagram" style={{ marginTop: 18 }}>
        <svg viewBox={`0 0 ${VBW} ${H}`} role="img" aria-label="Architecture tiers diagram" style={{ display: 'block', width: '100%', height: 'auto' }}>
          <defs>
            <marker id="arch-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" style={{ fill: 'none', stroke: 'var(--text-faint)', strokeWidth: 1.2 }} />
            </marker>
          </defs>
          {tiers.map((t, i) => {
            const y = Y0 + i * (BAND_H + GAP)
            return (
              <g key={t.label}>
                {i > 0 && <Connector y={y - GAP} />}
                <Tier y={y} label={t.label} right={t.right} nodes={t.nodes} />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="seealso">
        See also: <a href="/signal-flow">Signal Flow</a> · <a href="/data-flow">Data Flow</a> · <a href="/modules">Modules</a>
      </div>
    </div>
  )
}
