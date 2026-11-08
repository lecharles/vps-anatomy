// TrendBars — one SVG bar per recorded hour, from /api/trends.
//
// Scale is sqrt(value / max), not linear: hourly counts cluster in a narrow
// band (15 listeners, 6 residents), where linear bars are all the same
// height and one another's noise. sqrt spreads the low end so a 12-vs-15
// week reads as a difference, while keeping the tallest bar exactly the
// plot height. Value labels ride above each bar; hour ticks step along the
// bottom so a dense 24-hour row stays readable.

export type TrendPoint = { hour: string; value: number | null }

const SLOT = 34        // width reserved per hour
const BAR_W = 20
const PLOT_H = 84      // tallest bar
const TOP = 20         // room for value labels
const BOT = 18         // room for hour ticks
const PAD_X = 6

type Props = {
  points: TrendPoint[]
  label: string                 // aria summary, e.g. "Listeners per hour, last 24 hours"
  emptyText?: string            // shown when the history has no buckets
  accent?: string               // CSS color token for the bars
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export default function TrendBars({
  points,
  label,
  emptyText = 'No recorded hours yet — history builds as the scanner runs.',
  accent = 'var(--primary)',
}: Props) {
  if (points.length === 0) {
    return <div className="empty">{emptyText}</div>
  }

  const max = Math.max(...points.map((p) => p.value ?? 0), 1)
  const W = PAD_X * 2 + points.length * SLOT
  const H = TOP + PLOT_H + BOT
  const baseY = TOP + PLOT_H
  const tickEvery = Math.max(1, Math.ceil(points.length / 8))
  const last = [...points].reverse().find((p) => p.value !== null)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={last ? `${label}. Latest hour: ${fmt(last.value as number)}.` : label}
      style={{ display: 'block', width: '100%', height: 'auto', maxWidth: W, margin: '0 auto' }}
    >
      <line x1={PAD_X} y1={baseY} x2={W - PAD_X} y2={baseY}
        style={{ stroke: 'var(--hairline-2)', strokeWidth: 1 }} />
      {points.map((p, i) => {
        const x = PAD_X + i * SLOT + (SLOT - BAR_W) / 2
        const showTick = p.hour.slice(11, 16) === '00:00' || i % tickEvery === 0 || i === points.length - 1
        return (
          <g key={p.hour}>
            {p.value !== null && (() => {
              const h = Math.max(Math.sqrt(p.value / max) * PLOT_H, p.value > 0 ? 4 : 2)
              const y = baseY - h
              return (
                <>
                  <rect x={x} y={y} width={BAR_W} height={h} rx={3}
                    style={{ fill: accent, fillOpacity: 0.85 }} />
                  <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle"
                    style={{ fontSize: 9, fontWeight: 600, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {fmt(p.value)}
                  </text>
                </>
              )
            })()}
            {showTick && (
              <text x={x + BAR_W / 2} y={baseY + 13} textAnchor="middle"
                style={{ fontSize: 8.5, fill: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                {p.hour.slice(11, 16)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
