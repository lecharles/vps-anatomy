export default function DataFlow() {
  return (
    <section>
      <h2>Data Flow</h2>
      <p>How data persists: repos, databases, logs, memory, secrets, skills, and queues.</p>
      <div className="diagram-container">
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="400" fill="#FAFAFA"/>
          <text x="400" y="30" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#8C1515">Data Flow</text>
          <text x="400" y="50" textAnchor="middle" fontSize="12" fill="#6B6B6B">How data persists in the system</text>
          
          <rect x="50" y="100" width="120" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="110" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Git Repos</text>
          <text x="110" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">Code + commits</text>
          
          <rect x="220" y="100" width="120" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="280" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Databases</text>
          <text x="280" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">SQLite, JSON</text>
          
          <rect x="390" y="100" width="120" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="450" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Logs</text>
          <text x="450" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">Sessions, cron</text>
          
          <rect x="560" y="100" width="120" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="620" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Memory</text>
          <text x="620" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">Agent context</text>
          
          <rect x="220" y="220" width="120" height="60" fill="#FCE4EC" stroke="#C2185B" strokeWidth="2" rx="4"/>
          <text x="280" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Secrets</text>
          <text x="280" y="260" textAnchor="middle" fontSize="10" fill="#6B6B6B">Vault (700)</text>
          
          <rect x="390" y="220" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="450" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Skills</text>
          <text x="450" y="260" textAnchor="middle" fontSize="10" fill="#6B6B6B">Procedures</text>
          
          <rect x="560" y="220" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="620" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Queue</text>
          <text x="620" y="260" textAnchor="middle" fontSize="10" fill="#6B6B6B">Drafts, digests</text>
          
          <circle cx="400" cy="340" r="30" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2"/>
          <text x="400" y="345" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Agent</text>
          
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#6B6B6B"/>
            </marker>
          </defs>
          
          <line x1="400" y1="310" x2="110" y2="160" stroke="#6B6B6B" strokeWidth="1" markerEnd="url(#arrow)"/>
          <line x1="400" y1="310" x2="280" y2="160" stroke="#6B6B6B" strokeWidth="1" markerEnd="url(#arrow)"/>
          <line x1="400" y1="310" x2="450" y2="160" stroke="#6B6B6B" strokeWidth="1" markerEnd="url(#arrow)"/>
          <line x1="400" y1="310" x2="620" y2="160" stroke="#6B6B6B" strokeWidth="1" markerEnd="url(#arrow)"/>
        </svg>
      </div>
      <p style={{marginTop: '2rem'}}>See also: <a href="/architecture">Architecture</a> · <a href="/signal-flow">Signal Flow</a> · <a href="/changes">Changes</a></p>
    </section>
  )
}
