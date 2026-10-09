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
        <p className="sub">Six lessons, general to specific, about one real machine. The numbers you see are
          pulled from the live scanner while you read — this course updates itself.</p>
      </div>

      <article className="lesson" id="lesson-1">
        <div className="lesson-no">Lesson 1 · The Substrate</div>
        <h2>What is this machine?</h2>
        <p className="thesis">Before agents, services or ports — there is a computer. Everything else in this course is a program running on it.</p>
        <p>
          The machine is <span className="kbd">{m?.hostname ?? 'thehost'}</span>, a rented server at IP{' '}
          <span className="kbd">{m?.ip_public ?? '0.0.0.0'}</span>. It has no monitor, no keyboard and no desk.
          It sits in a datacenter, and every human interaction with it happens over a network: SSH for the operator,
          Telegram for the agents, HTTP for the dashboards. That is the first mental model: <strong>a computer you
          only ever touch through cables</strong>.
        </p>
        <p>Concretely, right now:</p>
        <ul>
          <li><strong>{m?.os ?? 'Ubuntu 24.04 LTS'}</strong> on {m?.arch ?? 'x86_64'} — a long-support release, chosen so the floor doesn't move under everything built on it.</li>
          <li><strong>{m?.cpus ?? '—'} CPU cores</strong> — shared by everything: two agents reasoning, ~18 services answering requests, cron jobs waking on schedule. When you read "load", this is what is being loaded.</li>
          <li><strong>{m?.ram_gb ?? '—'} GB of RAM</strong> — the scarcest resource. Every running program lives here; if RAM fills, the kernel starts killing things. Disk stays cheap, memory is not.</li>
          <li><strong>{m ? `${m.disk_used_gb} of ${m.disk_total_gb} GB disk` : '—'}</strong> — code, databases, logs, model files, and eight months of agent session history.</li>
          <li><strong>{m?.uptime_days ?? '—'} days of uptime</strong> — the machine has been continuously awake that long. Every service you'll meet started within this window, and the clock never resets unless someone reboots.</li>
        </ul>
        <p>
          A server like this is useful <em>because</em> it's boring: one address, one clock, one filesystem, always on.
          The interesting part is what people build on that flat surface — which is Lessons 2 through 5.
        </p>
        <div className="takeaway"><b>Takeaway</b> An "AI machine" is still a computer first: cores, RAM, disk, uptime. Every clever thing later in this course inherits those limits.</div>
      </article>

      <article className="lesson" id="lesson-2">
        <div className="lesson-no">Lesson 2 · The Players</div>
        <h2>The agents</h2>
        <p className="thesis">Agents are programs that read, decide, and act on this machine like an operator would — through terminals, files and APIs.</p>
        <p>
          Four residents do the work. They are not chatbots wearing a trench coat; each is a runtime with real
          credentials on this box, able to run commands, edit files and send messages.
        </p>
        <ul>
          <li><strong>Hermes</strong> — the general-purpose agent lane ("Rook"). It runs a gateway process that keeps a Telegram conversation alive, spawns coding sessions, maintains its own memory files and skills, and wrote the app you're reading. It owns this user account (<span className="kbd">hermes</span>).</li>
          <li><strong>OpenClaw</strong> — the second agent ("Philip"), the primary personal assistant. Its gateway listens on port <span className="kbd">18789</span> and drives its own Telegram lanes, session stores and model calls.</li>
          <li><strong>OpenCode</strong> — the shared coding engine. Both agents can invoke it; it records its sessions in a sqlite database on disk. One engine, many drivers.</li>
          <li><strong>Pi</strong> — a minimal coding agent, integrated as an alternative lane for terminal-first work.</li>
        </ul>
        <p>
          Why run <em>several</em> agents instead of one? Isolation and identity. Each has its own workspace, its own
          logs, its own lane of conversation. When something goes wrong you can attribute it — which is exactly what
          Lesson 4's permission model makes possible.
        </p>
        <div className="takeaway"><b>Takeaway</b> An agent = model + tools + persistent context + credentials. On this machine, the model is rented (API calls), but the tools, context and consequences are local.</div>
      </article>

      <article className="lesson" id="lesson-3">
        <div className="lesson-no">Lesson 3 · Plumbing</div>
        <h2>Services, ports and protocols</h2>
        <p className="thesis">Every program that talks to the outside world opens a TCP port. Ports are how a headless machine gets a face.</p>
        <p>
          A port is just a numbered door on one IP address. One machine, thousands of doors; each running service
          claims one and answers HTTP (or another protocol) there. The scanner in this very app reads the kernel's
          list of open doors every 30 seconds. The current census, and what it means:
        </p>
        <ul>
          <li><span className="kbd">:22</span> SSH — the operator's door. Everything else is downstream of someone having had this.</li>
          <li><span className="kbd">:8080</span> Mini-site server — static HTML dashboards, including the token/usage dashboard.</li>
          <li><span className="kbd">:8090</span> web-app — coding lane 1: fine-tuning and agent-testing web app.</li>
          <li><span className="kbd">:8091</span> research-app — coding lane 2: research dashboard.</li>
          <li><span className="kbd">:8093</span> VPS Anatomy — <em>this app</em>, FastAPI serving a React build.</li>
          <li><span className="kbd">:11434</span> Ollama — a local model runtime for embeddings and small models.</li>
          <li><span className="kbd">:18789</span> agent-gateway · <span className="kbd">:8000</span> Hermes lane API — the agents' own control ports, deliberately bound to localhost.</li>
        </ul>
        <p>
          How processes are kept alive matters too: <strong>systemd</strong> and <strong>systemd user services</strong>
          {' '}restart agents and gateways if they die; <strong>docker</strong> wraps services with their dependencies
          (databases, queues, workflow engines) into containers; <strong>cron</strong> wakes jobs on a schedule —
          like the dashboard that regenerates hourly at :05.
        </p>
        <div className="takeaway"><b>Takeaway</b> Ask "what's listening, and on which interface?" — the answer is a near-complete map of any server. That question is literally this app's scanner.</div>
      </article>

      <article className="lesson" id="lesson-4">
        <div className="lesson-no">Lesson 4 · Boundaries & Trust</div>
        <h2>Who can do what</h2>
        <p className="thesis">A machine where AI agents have shell access is a machine where permissions are the actual security model.</p>
        <p>Three boundary layers stack here:</p>
        <ul>
          <li><strong>Users.</strong> <span className="kbd">root</span> owns the system; <span className="kbd">hermes</span> owns the agent workspace and its files. The agents run as <em>you</em> (this user) — with your credentials, your limits. A beautiful demonstration of this lives in this app itself: the scanner, running as <span className="kbd">hermes</span>, sees its own processes' names but only port numbers for root-owned services. <strong>Observation is permissioned.</strong></li>
          <li><strong>Containers.</strong> Temporal, Postiz, databases — packaged in Docker. A container is a boundary: its own filesystem view, its own network entry, restart policies, and a blast radius limited to itself when things break.</li>
          <li><strong>Secrets.</strong> API keys and bot tokens live in env files and config dirs, never in git. Two rules follow from that: anything on GitHub is public; anything pasted into a model's context might be logged somewhere. Trust is scoped, not absolute.</li>
        </ul>
        <p>
          Public vs local binds are boundaries too: <span className="kbd">0.0.0.0:8093</span> says "anyone on the
          internet may connect", while <span className="kbd">127.0.0.1:18789</span> says "only this machine". The
          agents' private ports bind local on purpose — the public surface of this box is smaller than its interior.
        </p>
        <div className="takeaway"><b>Takeaway</b> On a headless box there is no "inside" the machine except Unix users, containers and bind addresses. Those are the walls, and agents live inside them honestly.</div>
      </article>

      <article className="lesson" id="lesson-5">
        <div className="lesson-no">Lesson 5 · Signal</div>
        <h2>How messages move</h2>
        <p className="thesis">Signal is the story of a single moment: one message, end to end, through every part of this machine.</p>
        <p>When a Telegram message arrives, the path is fixed and short:</p>
        <ul>
          <li>The <strong>gateway</strong> process (a long-lived loop) receives the update from Telegram's Bot API.</li>
          <li>It routes the message to a <strong>lane</strong> — a named conversation context with its own history.</li>
          <li>The <strong>agent</strong> builds context (memory, files, recent turns) and calls a <strong>model API</strong> — rented reasoning over HTTPS.</li>
          <li>When the model asks for a tool, the agent executes it <strong>locally</strong>: terminal, file, browser. The output is appended to context and the model continues.</li>
          <li>The final reply travels back the same path and lands in the chat.</li>
        </ul>
        <p>
          Notice the split: reasoning is remote and rented, but tools, memory and consequences are local and real.
          The Signal Flow page animates exactly this loop.
        </p>
        <div className="takeaway"><b>Takeaway</b> An agent's "mind" is an HTTP call; its "hands" are the local machine. The signal path is where those two halves meet.</div>
      </article>

      <article className="lesson" id="lesson-6">
        <div className="lesson-no">Lesson 6 · Memory</div>
        <h2>How data persists</h2>
        <p className="thesis">Signal is a moment; data is the accumulation of moments. Nothing an agent "remembers" exists until it is written to disk.</p>
        <p>The machine keeps its memory in six kinds of stores:</p>
        <ul>
          <li><strong>Git repos</strong> — code and its history. Commits are the machine's autobiography with hashes.</li>
          <li><strong>Databases</strong> — sqlite files and containerized Postgres. This app's own facts live in one of them.</li>
          <li><strong>Session logs</strong> — every assistant turn recorded as JSONL; the token dashboards read these.</li>
          <li><strong>Memory & skills</strong> — markdown files agents write to themselves. The cheapest, most honest persistence: plain text an agent can re-read.</li>
          <li><strong>Secrets</strong> — env files, permissioned tightly, excluded from git.</li>
          <li><strong>Queues</strong> — in-flight work (redis), so a crash mid-task doesn't lose the job.</li>
        </ul>
        <p>
          The Data Flow page shows the same message from Lesson 5 as a vertical diagram, but now reading sideways:
          each step writes to a store, and the next wake-up reads those stores back. <strong>Signal is time; data is
          sediment.</strong>
        </p>
        <div className="takeaway"><b>Takeaway</b> "State = what's on disk." Reboots don't erase what was committed, logged or written. That's why the agents keep journals.</div>
      </article>
    </div>
  )
}
