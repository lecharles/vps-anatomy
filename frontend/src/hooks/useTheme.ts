import { useEffect, useState } from 'react'

export type ThemeName = 'vps' | 'light' | 'stanford'

const KEY = '***'

export function currentTheme(): ThemeName {
  const saved = localStorage.getItem(KEY)
  return saved === 'light' || saved === 'stanford' || saved === 'vps' ? saved : 'vps'
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
