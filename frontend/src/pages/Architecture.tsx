import { useState, useEffect } from 'react'

interface Service {
  port: number
  bind: string
  name: string
  protocol: string
  public: boolean
  status: string
}

export default function Architecture() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services/')
      .then(res => res.json())
      .then(data => {
        setServices(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section>
      <h2>Architecture Diagram</h2>
      <p>Full system overview: agents, services, lanes, and external dependencies. Services are scanned live.</p>
      
      <div className="diagram-container">
        <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="#FAFAFA"/>
          <text x="400" y="30" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#8C1515">VPS Architecture</text>
          
          <rect x="50" y="60" width="700" height="500" fill="none" stroke="#8C1515" strokeWidth="2" strokeDasharray="5,5"/>
          <text x="60" y="80" fontSize="14" fill="#8C1515">VPS 0.0.0.0</text>
          
          {/* Agents */}
          <rect x="100" y="120" width="150" height="80" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" rx="4"/>
          <text x="175" y="150" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Hermes</text>
          <text x="175" y="170" textAnchor="middle" fontSize="11" fill="#6B6B6B">(Rook)</text>
          <text x="175" y="185" textAnchor="middle" fontSize="10" fill="#6B6B6B">Primary agent</text>
          
          <rect x="300" y="120" width="150" height="80" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" rx="4"/>
          <text x="375" y="150" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">OpenClaw</text>
          <text x="375" y="170" textAnchor="middle" fontSize="11" fill="#6B6B6B">(Philip)</text>
          <text x="375" y="185" textAnchor="middle" fontSize="10" fill="#6B6B6B">Second agent</text>
          
          <rect x="500" y="120" width="150" height="80" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" rx="4"/>
          <text x="575" y="150" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">OpenCode</text>
          <text x="575" y="170" textAnchor="middle" fontSize="11" fill="#6B6B6B">Root ops</text>
          
          {/* Services */}
          <rect x="100" y="250" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="160" y="275" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">Ollama</text>
          <text x="160" y="290" textAnchor="middle" fontSize="10" fill="#6B6B6B">:11434</text>
          
          <rect x="250" y="250" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="310" y="275" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">Docker</text>
          <text x="310" y="290" textAnchor="middle" fontSize="10" fill="#6B6B6B">containers</text>
          
          <rect x="400" y="250" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="460" y="275" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">Cron</text>
          <text x="460" y="290" textAnchor="middle" fontSize="10" fill="#6B6B6B">scheduler</text>
          
          <rect x="550" y="250" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="610" y="275" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">Secrets</text>
          <text x="610" y="290" textAnchor="middle" fontSize="10" fill="#6B6B6B">vault</text>
          
          {/* Lanes */}
          <rect x="100" y="360" width="150" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="175" y="385" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">web-app</text>
          <text x="175" y="400" textAnchor="middle" fontSize="10" fill="#6B6B6B">coding-1 :8090</text>
          
          <rect x="280" y="360" width="150" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="355" y="385" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">research-app</text>
          <text x="355" y="400" textAnchor="middle" fontSize="10" fill="#6B6B6B">coding-2 :8091</text>
          
          {/* External */}
          <rect x="100" y="470" width="120" height="60" fill="#FCE4EC" stroke="#C2185B" strokeWidth="2" rx="4"/>
          <text x="160" y="495" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">Telegram</text>
          <text x="160" y="510" textAnchor="middle" fontSize="10" fill="#6B6B6B">Bot API</text>
          
          <rect x="250" y="470" width="120" height="60" fill="#FCE4EC" stroke="#C2185B" strokeWidth="2" rx="4"/>
          <text x="310" y="495" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">GitHub</text>
          <text x="310" y="510" textAnchor="middle" fontSize="10" fill="#6B6B6B">API + git</text>
          
          <rect x="400" y="470" width="120" height="60" fill="#FCE4EC" stroke="#C2185B" strokeWidth="2" rx="4"/>
          <text x="460" y="495" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2E2D29">X/Twitter</text>
          <text x="460" y="510" textAnchor="middle" fontSize="10" fill="#6B6B6B">API + Chromium</text>
          
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#6B6B6B"/>
            </marker>
          </defs>
        </svg>
      </div>

      <h3 style={{marginTop: '2rem', color: 'var(--cardinal)'}}>Live Services ({services.length} detected)</h3>
      {loading ? (
        <p className="loading">Scanning...</p>
      ) : (
        <ul style={{listStyle: 'none', marginTop: '1rem'}}>
          {services.map((s, i) => (
            <li key={i} style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border)'}}>
              <strong>:{s.port}</strong> ({s.bind}) — {s.name} [{s.protocol}] {s.public ? '🌐 public' : '🔒 localhost'}
            </li>
          ))}
        </ul>
      )}
      
      <p style={{marginTop: '2rem'}}>See also: <a href="/signal-flow">Signal Flow</a> · <a href="/data-flow">Data Flow</a> · <a href="/changes">Changes</a></p>
    </section>
  )
}
