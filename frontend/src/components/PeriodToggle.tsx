// PeriodToggle — dashboard-language control for trend charts: Day · Week · Month.
// The value maps straight onto the `hours` param of /api/trends:
// day = 24, week = 168, month = 720 (the endpoint's ceiling, 30 days).

export type Period = 'day' | 'week' | 'month'

export const PERIOD_HOURS: Record<Period, number> = { day: 24, week: 168, month: 720 }

const BUTTONS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

type Props = {
  value: Period
  onChange: (p: Period) => void
}

export default function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="period-toggle" role="group" aria-label="Chart period">
      {BUTTONS.map((b) => (
        <button
          key={b.id}
          type="button"
          aria-pressed={value === b.id}
          className={value === b.id ? 'on' : ''}
          onClick={() => onChange(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
