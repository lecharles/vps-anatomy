import { useEffect, useState } from 'react'

export type ThemeName = 'vps' | 'light' | 'academic'

const KEY = '***'

function normalize(t: string | null): ThemeName | null {
  if (t === 'stanford') return 'academic' // legacy value, same migration as before
  return t === 'vps' || t === 'light' || t === 'academic' ? t : null
}

// S30 — ?theme=<name> is the deep-link contract, shared with /docs (that
// page reads the same param and writes the same key). On load the URL wins
// over the saved choice: a link promises what it names. Only values this
// app offers count; anything else — including the docs-only 'default' look
// — falls through to the saved value, then to vps.
function themeFromUrl(): ThemeName | null {
  return normalize(new URLSearchParams(window.location.search).get('theme'))
}

// The bar must never promise a theme the page is not drawing: every
// explicit choice writes ?theme= into the URL (replace, so switching
// themes doesn't stuff the history), which makes the page you are looking
// at the page you can share.
export function syncThemeParam(t: ThemeName) {
  const url = new URL(window.location.href)
  url.searchParams.set('theme', t)
  window.history.replaceState(window.history.state, '', url)
}

export function currentTheme(): ThemeName {
  const fromUrl = themeFromUrl()
  if (fromUrl) return fromUrl
  const saved = localStorage.getItem(KEY)
  if (saved === 'default') return 'vps' // docs-only mode ("stock Swagger"); app falls back to its own default
  return normalize(saved) ?? 'vps'
}

export function applyTheme(t: ThemeName) {
  if (t === 'vps') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', t)
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(currentTheme())
  useEffect(() => {
    localStorage.setItem(KEY, theme)
    applyTheme(theme)
    // a visible ?theme= never lies: when the bar names a theme (including
    // one this app maps elsewhere, e.g. the docs-only 'default'), keep it
    // naming what is actually drawn. Clean URLs stay clean — the saved key
    // carries those.
    if (new URLSearchParams(window.location.search).has('theme')) syncThemeParam(theme)
  }, [theme])
  const setTheme = (t: ThemeName) => {
    setThemeState(t)
    syncThemeParam(t) // the toggle's page is by definition shareable
  }
  return { theme, setTheme }
}
