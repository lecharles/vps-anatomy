import { useEffect, useState } from 'react'

export function useApi<T>(path: string, intervalMs = 30000): { data: T | null; error: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch(path)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => { if (alive) { setData(d); setError(false) } })
        .catch(() => { if (alive) setError(true) })
    load()
    const id = setInterval(load, intervalMs)
    return () => { alive = false; clearInterval(id) }
  }, [path, intervalMs])
  return { data, error }
}

export function relTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime()
  if (isNaN(t)) return ''
  const s = Math.max(0, (Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
