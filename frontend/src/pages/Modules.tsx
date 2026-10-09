import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Module {
  module_id: string
  name: string
  status: string
}

const MODULE_META: Record<string, string> = {
  hermes: 'Primary agent — Telegram gateway, scheduler, skills engine',
  openclaw: 'Second agent — general lane, collaborator',
  ollama: 'Local LLM inference — llama3.2:1b',
}

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/modules/')
      .then(res => res.json())
      .then(data => {
        setModules(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading modules...</div>

  return (
    <section>
      <h2>Modules</h2>
      <p>Deep dives into each component of the architecture. Click a card to learn more. Status is live — scanned every 30 seconds.</p>
      <div className="module-grid">
        {modules.map(m => (
          <Link key={m.module_id} to={`/modules/${m.module_id}`} className="module-card">
            <h3>{m.name}</h3>
            <p>{MODULE_META[m.module_id] || 'VPS component'}</p>
            <span className={`status status-${m.status}`}>{m.status}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
