import { useState, useEffect } from 'react'

interface Change {
  id: number
  timestamp: string
  change_type: string
  entity_type: string
  entity_id: string
  description: string
}

export default function Changes() {
  const [changes, setChanges] = useState<Change[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChanges = () => {
      fetch('/api/changes/?limit=50')
        .then(res => res.json())
        .then(data => {
          setChanges(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
    
    fetchChanges()
    const interval = setInterval(fetchChanges, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="loading">Loading changes...</div>

  return (
    <section>
      <h2>Changes — The VPS Story, Live</h2>
      <p>Every change the VPS makes is recorded here. This is the living story of the machine: services starting, stopping, modules updating. Refreshes every 10 seconds.</p>
      
      {changes.length === 0 ? (
        <p style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>
          No changes detected yet. The scanner is watching. Check back in a minute.
        </p>
      ) : (
        <ul className="changes-feed">
          {changes.map(c => (
            <li key={c.id} className="change-item">
              <div className="timestamp">{new Date(c.timestamp).toLocaleString()}</div>
              <div className="description">
                {c.description}
                <span className={`change-type type-${c.change_type}`}>{c.change_type}</span>
              </div>
              <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                {c.entity_type}: {c.entity_id}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
