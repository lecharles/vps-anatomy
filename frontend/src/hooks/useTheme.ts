import { useEffect, useState } from 'react'

export type ThemeName = 'vps' | 'light' | 'academic'

const KEY = '***'

export function currentTheme(): ThemeName {
  const saved = localStorage.getItem(KEY)
  if (saved === 'stanford') return 'academic' // migrate older saved value
  return saved === 'light' || saved === 'academic' || saved === 'vps' ? saved : 'vps'
}

export function applyTheme(t: ThemeName) {
  if (t === 'vps') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', t)
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(currentTheme())
  useEffect(() => {
    localStorage.setItem(KEY, theme)
    applyTheme(theme)
  }, [theme])
  return { theme, setTheme }
}
