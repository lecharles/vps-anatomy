import { useTheme, type ThemeName } from '../hooks/useTheme'

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'vps', label: 'VPS' },
  { id: 'light', label: 'Light' },
  { id: 'stanford', label: 'Stanford' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {THEMES.map((t) => (
        <button key={t.id} className={theme === t.id ? 'on' : ''} onClick={() => setTheme(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
