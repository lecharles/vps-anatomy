import { useState, useEffect } from 'react'

interface MachineState {
  hostname: string
  os: string
  arch: string
  cpus: number
  ram_gb: number
  disk_total_gb: number
  disk_used_gb: number
  uptime_days: number
  ip_public: string
}

export default function Home() {
  const [machine, setMachine] = useState<MachineState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/machine/')
      .then(res => res.json())
      .then(data => {
        setMachine(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading machine state...</div>

  return (
    <section>
      <h2>Welcome to VPS Anatomy</h2>
      <p>This is an educational web app that tells the story of a live AI-agent VPS. It's designed like a Stanford CS course: modern, pedagogical, and structured from general to specific.</p>
      <p>You'll learn about the machine, the agents that run on it, the services that keep it alive, the boundaries that secure it, and the signal and data flows that make it work.</p>
      <p><strong>This app is alive.</strong> It scans the VPS every 30 seconds and updates itself autonomously. Watch the <a href="/changes">Changes</a> page to see the VPS evolve in real time.</p>
      
      <h3 style={{marginTop: '2rem', color: 'var(--cardinal)'}}>The Machine (Live)</h3>
      {machine && (
        <ul style={{listStyle: 'none', marginTop: '1rem'}}>
          <li><strong>Hostname:</strong> {machine.hostname}</li>
          <li><strong>OS:</strong> {machine.os}</li>
          <li><strong>CPUs:</strong> {machine.cpus}</li>
          <li><strong>RAM:</strong> {machine.ram_gb} GB</li>
          <li><strong>Disk:</strong> {machine.disk_used_gb} / {machine.disk_total_gb} GB</li>
          <li><strong>Uptime:</strong> {machine.uptime_days} days</li>
          <li><strong>Public IP:</strong> {machine.ip_public}</li>
        </ul>
      )}
      
      <h3 style={{marginTop: '2rem', color: 'var(--cardinal)'}}>Start Learning</h3>
      <p>Go to <a href="/lessons">Lessons</a> for the full course, or jump to <a href="/modules">Modules</a> for deep dives on each component.</p>
    </section>
  )
}
