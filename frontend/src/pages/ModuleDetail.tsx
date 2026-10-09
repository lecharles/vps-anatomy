import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface ModuleState {
  module_id: string
  name: string
  status: string
  data: Record<string, unknown> | null
  timestamp: string
}

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const [module, setModule] = useState<ModuleState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/modules/${moduleId}`)
      .then(res => res.json())
      .then(data => {
        setModule(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [moduleId])

  if (loading) return <div className="loading">Loading module...</div>
  if (!module) return <div className="loading">Module not found</div>

  return (
    <section className="module-detail">
      <h2>{module.name}</h2>
      <p className="subtitle">Status: <span className={`status status-${module.status}`}>{module.status}</span></p>
      <p className="subtitle">Last scanned: {new Date(module.timestamp).toLocaleString()}</p>
      
      <section>
        <h3>Live Data</h3>
        {module.data && Object.keys(module.data).length > 0 ? (
          <ul>
            {Object.entries(module.data).map(([key, value]) => (
              <li key={key}>
                <span className="key">{key}:</span>{' '}
                <span className="value">{String(value ?? 'null')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No live data available for this module.</p>
        )}
      </section>

      <p style={{marginTop: '2rem'}}><Link to="/modules">← Back to all modules</Link></p>
    </section>
  )
}
