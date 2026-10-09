import { useApi } from '../hooks/useApi'

type Machine = {
  hostname: string; os: string; arch: string; cpus: number; ram_gb: number
  disk_total_gb: number; disk_used_gb: number; uptime_days: number; ip_public: string
}

export default function Lessons() {
  const { data: m } = useApi<Machine>('/api/machine/')
  return (
    <div>
      <div className="page-head">
        <h1>The Course</h1>
        <p className="sub">Six lessons, general to specific, about one real server. The numbers you see are
          pulled from the live scanner while you read — this course updates itself.</p>
      </div>

      <article className="lesson" id="lesson-1">
        <div className="lesson-no">Lesson 1 · Hardware</div>
        <h2>What is this server?</h2>
        <p className="thesis">Before agents, services or ports — there is a computer. Everything else in this course is a program running on it.</p>
        <p>
          This server is <span className="kbd">{m?.hostname ?? 'unnamed'}</span>, a rented VPS at IP{' '}
          <span className="kbd">{m?.ip_public ?? '(reported live)'}</span>. It has no monitor, no keyboard and no desk.
          It sits in a datacenter, and every human interaction with it happens over a network: SSH for the operator,
          Telegram for the agents, HTTP for the dashboards. The first mental model: <strong>a computer you
          only ever reach over the network</strong>.
        </p>
        <p>Concretely, right now:</p>
        <ul>
          <li><strong>{m?.os ?? 'Ubuntu 24.04 LTS'}</strong> on {m?.arch ?? 'x86_64'} — a long-support release, chosen so the base doesn't move under everything built on it.</li>
          <li><strong>{m?.cpus ?? '—'} CPU cores</strong> — shared by everything: agents reasoning, services answering requests, cron jobs waking on schedule. When you read "load", this is what is being loaded.</li>
          <li><strong>{m?.ram_gb ?? '—'} GB of RAM</strong> — the scarcest resource. Every running program lives here; if RAM fills, the kernel starts killing things. Disk stays cheap, memory is not.</li>
          <li><strong>{m ? `${m.disk_used_gb} of ${m.disk_total_gb} GB disk` : '—'}</strong> — code, databases, logs, model files, and months of agent session history.</li>
          <li><strong>{m?.uptime_days ?? '—'} days of uptime</strong> — the server has been running continuously that long. Every service you'll meet started within this window, and the clock never resets unless someone reboots.</li>
        </ul>
        <p>
          A server like this is useful <em>because</em> it's boring: one address, one clock, one filesystem, always on.
          The interesting part is what people build on top — which is Lessons 2 through 5.
        </p>
        <div className="takeaway"><b>Takeaway</b> An AI server is still a computer first: cores, RAM, disk, uptime. Everything later in this course inherits those limits.</div>
      </article>

      <article className="lesson" id="lesson-2">
        <div className="lesson-no">Lesson 2 · Agents</div>
        <h2>Agents</h2>
        <p className="thesis">Agents are programs that read, decide, and act on this server like an operator would — through terminals, files and APIs.</p>
        <p>
          Four of them do the work. Each is a runtime with real credentials on this server, able to run commands,
          edit files and send messages.
        </p>
        <ul>
          <li><strong>Hermes</strong> — the general-purpose agent runtime. It runs a gateway process that keeps a Telegram conversation alive, spawns coding sessions, maintains its own memory files and skills, and wrote the app you're reading. It owns this user account (<span className="kbd">hermes</span>).</li>
          <li><strong>OpenClaw</strong> — the second agent runtime, the personal assistant. Its gateway listens locally and drives its own Telegram lanes, session stores and model calls.</li>
          <li><strong>OpenCode</strong> — the shared coding engine. Both agents can invoke it; it records its sessions in a sqlite database on disk. One engine, many drivers.</li>
          <li><strong>Pi</strong> — a minimal coding agent, integrated as an alternative lane for terminal-first work.</li>
        </ul>
        <p>
          Why run <em>several</em> agents instead of one? Isolation and identity. Each has its own workspace, its own
          logs, its own lane of conversation. When something goes wrong you can attribute it — which is exactly what
          Lesson 4's permission model makes possible.
        </p>
        <div className="takeaway"><b>Takeaway</b> An agent = model + tools + persistent context + credentials. The model runs remotely over an API; the tools, context and files are local.</div>
      </article>

      <article className="lesson" id="lesson-3">
        <div className="lesson-no">Lesson 3 · Ports & Services</div>
        <h2>Services, ports and protocols</h2>
        <p className="thesis">Every program that talks to the outside world opens a TCP port. On a headless server, ports are the entire surface.</p>
        <p>
          A port is a numbered socket on one IP address. Each running service claims one and answers HTTP
          (or another protocol) there. The scanner in this app reads the kernel's list of open ports every 30
          seconds. What's typically here, and what each one means:
        </p>
        <ul>
          <li><span className="kbd">:22</span> SSH — administrative access. Everything else is downstream of someone having had it.</li>
          <li>A band of web apps (this one among them) on ports near <span className="kbd">:8000</span>–<span className="kbd">:9000</span>, each a FastAPI server on a React build.</li>
          <li>A model runtime on <span className="kbd">:11434</span> for local inference.</li>
          <li>Agent control ports — deliberately bound to localhost, never public.</li>
          <li>The live list, with names and binds for this server, is one call away: <a className="kbd" href="/api/services/">/api/services/</a>.</li>
        </ul>
        <p>
          How processes are kept alive matters too: <strong>systemd</strong> and <strong>systemd user services</strong>
          {' '}restart agents and gateways if they die; <strong>docker</strong> wraps services with their dependencies
          (databases, queues, workflow engines) into containers; <strong>cron</strong> wakes jobs on a schedule —
          like the dashboards that regenerate hourly.
        </p>
        <div className="takeaway"><b>Takeaway</b> Ask "what's listening, and on which interface?" — the answer is a near-complete map of any server. That question is literally this app's scanner.</div>
      </article>

      <article className="lesson" id="lesson-4">
        <div className="lesson-no">Lesson 4 · Permissions</div>
        <h2>Who can do what</h2>
        <p className="thesis">When AI agents have shell access, Unix permissions become the actual security model.</p>
        <p>Three boundary layers stack here:</p>
        <ul>
          <li><strong>Users.</strong> <span className="kbd">root</span> owns the system; <span className="kbd">hermes</span> owns the agent workspace and its files. The agents run as <em>you</em> (this user) — with your credentials, your limits. This app demonstrates it directly: the scanner, running as <span className="kbd">hermes</span>, sees its own processes' names but only port numbers for root-owned services. <strong>Observation is permissioned.</strong></li>
          <li><strong>Containers.</strong> Databases, queues and workflow engines — packaged in Docker. A container is a boundary: its own filesystem view, its own network entry, restart policies, and a blast radius limited to itself when things break.</li>
          <li><strong>Secrets.</strong> API keys and bot tokens live in env files and config dirs, never in git. Two rules follow from that: anything on GitHub is public; anything pasted into a model's context might be logged somewhere. Trust is scoped, not absolute.</li>
        </ul>
        <p>
          Public vs local binds are boundaries too: a bind like <span className="kbd">0.0.0.0:PORT</span> says "anyone on the
          internet may connect", while <span className="kbd">127.0.0.1:PORT</span> says "only this server". The
          agents' private ports bind local on purpose — the public surface is smaller than the full set of listeners.
        </p>
        <div className="takeaway"><b>Takeaway</b> There is no "inside" on a headless server except Unix users, containers and bind addresses. Those are the boundaries; everything runs within them.</div>
      </article>

      <article className="lesson" id="lesson-5">
        <div className="lesson-no">Lesson 5 · Signal</div>
        <h2>How messages move</h2>
        <p className="thesis">One message, end to end, through every part of the server.</p>
        <p>When a Telegram message arrives, the path is fixed and short:</p>
        <ul>
          <li>The <strong>gateway</strong> process (a long-lived loop) receives the update from Telegram's Bot API.</li>
          <li>It routes the message to a <strong>lane</strong> — a named conversation context with its own history.</li>
          <li>The <strong>agent</strong> builds context (memory, files, recent turns) and calls a <strong>model API</strong> over HTTPS.</li>
          <li>When the model asks for a tool, the agent executes it <strong>locally</strong>: terminal, file, browser. The output is appended to context and the model continues.</li>
          <li>The final reply travels back the same path and lands in the chat.</li>
        </ul>
        <p>
          Note the split: model calls are remote, but tools, memory and files are local — and their effects are real.
          The Signal Flow page draws this loop.
        </p>
        <div className="takeaway"><b>Takeaway</b> An agent's model calls are remote HTTP; its tools and files are local. The signal path is where the two meet.</div>
      </article>

      <article className="lesson" id="lesson-6">
        <div className="lesson-no">Lesson 6 · Storage</div>
        <h2>How data persists</h2>
        <p className="thesis">Signal is a moment; data is what accumulates from repeated moments. Nothing an agent "remembers" exists until it is written to disk.</p>
        <p>State lives in six kinds of stores:</p>
        <ul>
          <li><strong>Git repos</strong> — code and its history, addressable by commit hash.</li>
          <li><strong>Databases</strong> — sqlite files and containerized Postgres. This app's own facts live in one of them.</li>
          <li><strong>Session logs</strong> — every assistant turn recorded as JSONL; the token dashboards read these.</li>
          <li><strong>Memory & skills</strong> — markdown files that agents write for themselves, re-read at startup. Plain text, and the cheapest persistence there is.</li>
          <li><strong>Secrets</strong> — env files, permissioned tightly, excluded from git.</li>
          <li><strong>Queues</strong> — in-flight work (redis), so a crash mid-task doesn't lose the job.</li>
        </ul>
        <p>
          The Data Flow page shows the same message from Lesson 5 as a vertical diagram:
          each step writes to a store, and the next session reads those stores back.
        </p>
        <div className="takeaway"><b>Takeaway</b> "State = what's on disk." Reboots don't erase what was committed, logged or written.</div>
      </article>
    </div>
  )
}
