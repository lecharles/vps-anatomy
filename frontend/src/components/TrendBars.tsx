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
//
// Hovering a slot (S12a) highlights its bar, reveals a value label even on
// dense charts, and drives the caption below: when · value · scans. The
// caption defaults to the latest recorded bucket, so the chart answers its
// headline question before you touch it. Each slot also carries a native
// <title> — no hover machinery required for the same facts.
//
// S12b gives the chart its vocabulary: a legend line naming the series,
// what one value counts, and what one bar spans — so Home's blue bars and
// Architecture's green ones say what they are without the reader guessing
// from page context. And the tallest bar keeps its value label even on
// dense charts, because with a square-root scale the ceiling IS the axis:
// "max 15" under the highest bar lets every other bar be read honestly.

import { useState } from 'react'

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
  seriesName?: string           // legend copy (S12b): names the series, e.g. "Listeners"
  unit?: string                 // what one value counts, e.g. "distinct TCP ports"
  perBar?: string               // what one bar spans, e.g. "one bar = one UTC hour"
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

/** "2026-11-11 04:00" from a bucket key — the caption speaks exact UTC. */
function when(hour: string): string {
  return `${hour.slice(0, 10)} ${hour.slice(11, 16)}`
}

export default function TrendBars({
  points,
  label,
  emptyText = 'No recorded hours yet — history builds as the scanner runs.',
  accent = 'var(--primary)',
  tickStyle = 'hour',
  seriesName,
  unit,
  perBar,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)

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
  // S12b: the tallest bar is the scale's ceiling — its value label is the
  // axis on a sqrt chart, so it survives density. And a slot with no bar
  // is information (a gap in the record), so the legend names it when gaps
  // actually exist on this chart.
  const maxIdx = points.reduce(
    (best, p, i) => (p.value !== null && (best < 0 || p.value > (points[best].value ?? 0)) ? i : best),
    -1,
  )
  const hasGaps = points.some((p) => p.value === null)

  // Caption content: hovered slot wins; otherwise the latest reading,
  // so the line under the chart always states something truthful.
  const shown = hover !== null ? points[hover] : (last ?? points[points.length - 1])
  const caption = shown.value === null
    ? `${when(shown.hour)} · no reading`
    : `${when(shown.hour)} · ${fmt(shown.value)}${hover === null ? ' (latest)' : ''}`

  return (
    <>
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
          const isHover = hover === i
          const showTick = tickStyle === 'date'
            ? i % tickEvery === 0 || i === points.length - 1
            : p.hour.slice(11, 16) === '00:00' || i % tickEvery === 0 || i === points.length - 1
          return (
            <g key={p.hour}
              style={{ cursor: 'crosshair' }}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(h => (h === i ? null : h))}
              onClick={() => setHover(isHover ? null : i)} /* tap = hold, for touch */
            >
              <title>{`${p.hour} · ${p.value === null ? 'no reading' : fmt(p.value)}`}</title>
              {/* invisible strip spanning the whole slot: the hover target
                  exists even where the bar is short or missing */}
              <rect x={PAD_X + i * slot} y={0} width={slot} height={baseY} fill="transparent" />
              {p.value !== null && (() => {
                const h = Math.max(Math.sqrt(p.value / max) * PLOT_H, p.value > 0 ? 4 : 2)
                const y = baseY - h
                return (
                  <>
                    <rect x={x} y={y} width={barW} height={h} rx={Math.min(3, barW / 2)}
                      style={{ fill: accent, fillOpacity: isHover ? 1 : 0.85, transition: 'fill-opacity 120ms' }} />
                    {(showLabels || isHover || i === maxIdx) && (
                      <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                        style={{ fontSize: 9, fontWeight: 600, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {/* on dense charts the ceiling label is the axis — say so */}
                        {!showLabels && i === maxIdx && !isHover ? `max ${fmt(p.value)}` : fmt(p.value)}
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
      {seriesName && (
        <div className="trend-legend">
          <span className="trend-legend-swatch" style={{ background: accent }} aria-hidden="true" />
          <b className="trend-legend-name">{seriesName}</b>
          {unit && <span className="trend-legend-note">— {unit}</span>}
          {perBar && <span className="trend-legend-note">· {perBar}</span>}
          {hasGaps && <span className="trend-legend-note">· no bar = no reading</span>}
        </div>
      )}
      <div className="trend-caption" aria-live="polite">{caption}</div>
    </>
  )
}
