export default function Lessons() {
  const lessons = [
    {title: 'What is this machine?', desc: 'Hardware, OS, uptime, resources — the physical foundation'},
    {title: 'The Players', desc: 'Agents: Hermes (Rook), OpenClaw (Philip), OpenCode, Pi — who does what'},
    {title: 'Plumbing', desc: 'Services, ports, protocols, systemd units — how everything connects'},
    {title: 'Boundaries & Trust', desc: 'Users, permissions, secrets, container vs host — security model'},
    {title: 'Signal Flow', desc: 'Telegram → gateway → agent → tool → result — how messages move'},
    {title: 'Data Flow', desc: 'Repos, databases, logs, memory lanes — how data persists'}
  ]

  return (
    <section>
      <h2>Lessons</h2>
      <p>Six lessons from general to specific. Each builds on the last.</p>
      <ol className="lesson-list">
        {lessons.map((l, i) => (
          <li key={i}>
            <h3>{l.title}</h3>
            <p>{l.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
