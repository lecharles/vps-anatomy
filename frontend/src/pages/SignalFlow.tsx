export default function SignalFlow() {
  return (
    <section>
      <h2>Signal Flow</h2>
      <p>How messages move: from Telegram user → gateway → agent → tool → result → response → back to user.</p>
      <div className="diagram-container">
        <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="400" fill="#FAFAFA"/>
          <text x="400" y="30" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#8C1515">Signal Flow</text>
          <text x="400" y="50" textAnchor="middle" fontSize="12" fill="#6B6B6B">How messages move through the system</text>
          
          <rect x="50" y="100" width="120" height="60" fill="#FCE4EC" stroke="#C2185B" strokeWidth="2" rx="4"/>
          <text x="110" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Telegram</text>
          <text x="110" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">User message</text>
          
          <rect x="220" y="100" width="120" height="60" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" rx="4"/>
          <text x="280" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Gateway</text>
          <text x="280" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">Route to lane</text>
          
          <rect x="390" y="100" width="120" height="60" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" rx="4"/>
          <text x="450" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Agent</text>
          <text x="450" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">Hermes/OpenClaw</text>
          
          <rect x="560" y="100" width="120" height="60" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" rx="4"/>
          <text x="620" y="125" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Tool</text>
          <text x="620" y="140" textAnchor="middle" fontSize="10" fill="#6B6B6B">terminal/file/web</text>
          
          <rect x="560" y="220" width="120" height="60" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="4"/>
          <text x="620" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Result</text>
          <text x="620" y="260" textAnchor="middle" fontSize="10" fill="#6B6B6B">Tool output</text>
          
          <rect x="220" y="220" width="120" height="60" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" rx="4"/>
          <text x="280" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Response</text>
          <text x="280" y="260" textAnchor="middle" fontSize="10" fill="#6B6B6B">Agent reply</text>
          
          <rect x="50" y="220" width="120" height="60" fill="#FCE4EC" stroke="#C2185B" strokeWidth="2" rx="4"/>
          <text x="110" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E2D29">Telegram</text>
          <text x="110" y="260" textAnchor="middle" fontSize="10" fill="#6B6B6B">User sees reply</text>
          
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#6B6B6B"/>
            </marker>
          </defs>
          
          <line x1="170" y1="130" x2="220" y2="130" stroke="#6B6B6B" strokeWidth="2" markerEnd="url(#arrow)"/>
          <line x1="340" y1="130" x2="390" y2="130" stroke="#6B6B6B" strokeWidth="2" markerEnd="url(#arrow)"/>
          <line x1="510" y1="130" x2="560" y2="130" stroke="#6B6B6B" strokeWidth="2" markerEnd="url(#arrow)"/>
          <line x1="620" y1="160" x2="620" y2="220" stroke="#6B6B6B" strokeWidth="2" markerEnd="url(#arrow)"/>
          <line x1="560" y1="250" x2="340" y2="250" stroke="#6B6B6B" strokeWidth="2" markerEnd="url(#arrow)"/>
          <line x1="220" y1="250" x2="170" y2="250" stroke="#6B6B6B" strokeWidth="2" markerEnd="url(#arrow)"/>
        </svg>
      </div>
      <p style={{marginTop: '2rem'}}>See also: <a href="/architecture">Architecture</a> · <a href="/data-flow">Data Flow</a> · <a href="/changes">Changes</a></p>
    </section>
  )
}
