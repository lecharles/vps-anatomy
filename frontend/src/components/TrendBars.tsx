// TrendBars — one SVG bar per recorded bucket, from /api/trends.
//
// Scale is sqrt(value / max), not linear: hourly counts cluster in a narrow
// band (15 listeners, 6 residents), where linear bars are all the same
// height and one another's noise. sqrt spreads the low end so a 12-vs-15
// week reads as a difference, while keeping the tallest bar exactly the
// plot height. Value labels ride above each bar; hour ticks step along the
// bottom so a dense 24-hour row stays readable.
//
// With the Day/Week/Month period toggle (S8c), buckets can be days instead
// of hours: pass tickStyle="date" to tick with MM-DD, and use rollupDaily()
// to collapse hourly points into one daily mean per UTC day. Charts handed
// more than 40 points shrink their slots and drop per-bar labels rather
// than render a wall.

export type TrendPoint = { hour: string; value: number | null }

/** Collapse hourly points into one point per UTC day: the mean of that
 *  day's non-null values, keyed at midnight so the hour format (and the
 *  tick logic) stays the same. Days with no readings are simply absent. */
export function rollupDaily(points: TrendPoint[]): TrendPoint[] {
  const byDay = new Map<string, { sum: number; n: number }>()
  for (const p of points) {
    if (p.value === null) continue
    const day = p.hour.slice(0, 10)
    const acc = byDay.get(day) ?? { sum: 0, n: 0 }
    acc.sum += p.value
    acc.n += 1
    byDay.set(day, acc)
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, { sum, n }]) => ({
      hour: `${day}T00:00:00Z`,
      value: Math.round((sum / n) * 10) / 10,
    }))
}

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
  tickStyle?: 'hour' | 'date'   // bottom ticks: HH:MM for hourly, MM-DD for daily buckets
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export default function TrendBars({
  points,
  label,
  emptyText = 'No recorded hours yet — history builds as the scanner runs.',
  accent = 'var(--primary)',
  tickStyle = 'hour',
}: Props) {
  if (points.length === 0) {
    return <div className="empty">{emptyText}</div>
  }

  const max = Math.max(...points.map((p) => p.value ?? 0), 1)
  // Dense charts (more than a day's worth of hourly points) compress the
  // slot so the figure stays a sane width, and drop per-bar labels.
  const dense = points.length > 40
  const slot = dense ? Math.max(6, Math.floor(1400 / points.length)) : SLOT
  const barW = Math.max(3, Math.min(BAR_W, slot - 2))
  const showLabels = !dense
  const W = PAD_X * 2 + points.length * slot
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
        const x = PAD_X + i * slot + (slot - barW) / 2
        const showTick = tickStyle === 'date'
          ? i % tickEvery === 0 || i === points.length - 1
          : p.hour.slice(11, 16) === '00:00' || i % tickEvery === 0 || i === points.length - 1
        return (
          <g key={p.hour}>
            {p.value !== null && (() => {
              const h = Math.max(Math.sqrt(p.value / max) * PLOT_H, p.value > 0 ? 4 : 2)
              const y = baseY - h
              return (
                <>
                  <rect x={x} y={y} width={barW} height={h} rx={Math.min(3, barW / 2)}
                    style={{ fill: accent, fillOpacity: 0.85 }} />
                  {showLabels && (
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                      style={{ fontSize: 9, fontWeight: 600, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {fmt(p.value)}
                    </text>
                  )}
                </>
              )
            })()}
            {showTick && (
              <text x={x + barW / 2} y={baseY + 13} textAnchor="middle"
                style={{ fontSize: 8.5, fill: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                {tickStyle === 'date' ? p.hour.slice(5, 10) : p.hour.slice(11, 16)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
