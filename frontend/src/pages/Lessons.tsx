import { useRef, useState } from 'react'
import { useApi } from '../hooks/useApi'

// S28 — tiny client-side lesson search. The index IS the rendered page:
// each lesson's textContent is read from its article, so copy edits can
// never drift out of a hand-maintained search corpus, and the live
// numbers this course quotes (S13a, S22) are themselves findable.
// One input, one filtered list, one stated result — no fuzzy ranking,
// no network call, no invented relevance.
const LESSON_NAMES = ['Hardware', 'Agents', 'Ports & Services', 'Permissions', 'Signal', 'Storage']

type Machine = {
  hostname: string; os: string; arch: string; cpus: number; ram_gb: number
  disk_total_gb: number; disk_used_gb: number; uptime_days: number; ip_public: string
}

// Lesson 3 speaks in live numbers (S13a): every category row counts what
// the scanner sees RIGHT NOW on that port band, from /api/services/.
// The data is a poll away — so the row itself carries the count and a
// link to the very endpoint that produced it. Stale copy beats nothing;
// live copy beats stale.
type Service = { port: number; bind: string; name: string; owner: string; public: boolean; status: string }

// S22 applies the same rule to Lesson 5: the message path is quoted with
// the probe block the scanner just measured (/api/latency/) and the
// hour-by-hour listener record (/api/trends/). Numbers, not adjectives.
type LatSample = { port: number; connect_ms: number | null; ok: boolean; probes: number; hits: number; timestamp: string }
type TrendHour = { hour: string; services_listening: number | null }

function median(xs: number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function LiveChip({ n, title }: { n: number | null; title: string }) {
  if (n === null) return null
  return (
    <a className="lesson-live" href="/api/services/" title={title}>
      <span className={n > 0 ? 'live-dot on' : 'live-dot'} />
      {n === 0 ? 'not caught this scan' : `${n} live now`}
    </a>
  )
}

// S17b — keyboard nav between lessons. Each lesson article is a tab
// stop; arrows jump card to card, Home/End jump to the ends. Only the
// article itself swallows the keypress (e.target check) so links,
// chips and any future input inside a lesson keep their own arrows.
// Focus moves with the ring the CSS gives every tabbable element,
// never a silent scroll — the reader always knows where they landed.
export default function Lessons() {
  const { data: m } = useApi<Machine>('/api/machine/')
  const { data: svcs } = useApi<Service[]>('/api/services/', 30000)
  const { data: lat } = useApi<LatSample[]>('/api/latency/', 30000)
  const { data: day } = useApi<TrendHour[]>('/api/trends/?hours=24&metrics=services', 60000)
  const services = svcs // null until the first poll answers
  const count = (pred: (s: Service) => boolean) =>
    services === null ? null : services.filter(pred).length
  // S22 — the numbers Lesson 5 quotes: answered probes and the median
  // of the answered handshakes (median, because one outlier wake-up
  // must not move a figure on a public page), and the honest min/max
  // of the last 24 recorded hours. A null means 'not polled yet' and
  // renders as a stated gap, never as a zero.
  const hopMs = (lat ?? [])
    .filter((s) => s.ok && s.connect_ms != null)
    .map((s) => s.connect_ms as number)
  const medHop = median(hopMs)
  const slowHop = hopMs.length ? Math.max(...hopMs) : null
  const probes = (lat ?? []).reduce((a, s) => a + s.probes, 0)
  const hits = (lat ?? []).reduce((a, s) => a + s.hits, 0)
  const held = (day ?? [])
    .map((d) => d.services_listening)
    .filter((v): v is number => v != null)
  const cards = useRef<Record<number, HTMLElement | null>>({})
  const [query, setQuery] = useState('')
  const norm = query.trim().toLowerCase()
  // An empty query is not a search: every lesson shows. A non-empty one
  // reads the article's own rendered text — the same words the reader sees.
  const shown = (i: number) =>
    norm === '' || (cards.current[i]?.textContent ?? '').toLowerCase().includes(norm)
  const visible: number[] = []
  for (let i = 0; i < 6; i++) if (shown(i)) visible.push(i)
  // S17b — keyboard nav between lessons, now search-aware: arrows walk
  // the VISIBLE set, so a filtered page never focuses a hidden article
  // (a display:none element cannot hold focus — the jump would silently
  // die). Only the article itself swallows the keypress (e.target check)
  // so links, chips and the search input keep their own keys. Focus
  // moves with the ring the CSS gives every tabbable element.
  const jump = (e: React.KeyboardEvent<HTMLElement>, self: number) => {
    if (e.target !== e.currentTarget) return
    const pos = visible.indexOf(self)
    if (pos === -1) return
    let to: number | null = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = visible[Math.min(pos + 1, visible.length - 1)]
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = visible[Math.max(pos - 1, 0)]
    else if (e.key === 'Home') to = visible[0]
    else if (e.key === 'End') to = visible[visible.length - 1]
    if (to === null || to === undefined) return
    e.preventDefault()
    cards.current[to]?.focus()
  }
  return (
    <div>
      <div className="page-head">
        <h1>The Course</h1>
        <p className="sub">Six lessons, general to specific, about one real server. The numbers you see are
          pulled from the live scanner while you read — this course updates itself.</p>
        <p className="kbd-hint">
          <span className="kbd">Tab</span> reaches search and each visible lesson · <span className="kbd">↑ ↓</span> jump between them ·{' '}
          <span className="kbd">Home</span>/<span className="kbd">End</span> the first and last · <span className="kbd">Esc</span> clears the search
        </p>
        <div className="lesson-search">
          <label htmlFor="lesson-q">Search</label>
          <input
            id="lesson-q"
            type="search"
            autoComplete="off"
            placeholder="all six lessons, plain substring — try “ports”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setQuery('')
              }
            }}
            aria-describedby="lesson-q-count"
          />
          <span id="lesson-q-count" className="search-count" aria-live="polite">
            {norm === ''
              ? 'six lessons, all shown'
              : `${visible.length} of 6 ${visible.length === 1 ? 'lesson' : 'lessons'} contain “${query.trim()}”`}
          </span>
        </div>
      </div>

      <article className="lesson" id="lesson-1" aria-labelledby="lesson-1-h" tabIndex={0} hidden={!shown(0)}
        ref={(el) => { cards.current[0] = el }} onKeyDown={(e) => jump(e, 0)}>
        <div className="lesson-no">Lesson 1 · Hardware</div>
        <h2 id="lesson-1-h">What is this server?</h2>
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

      <article className="lesson" id="lesson-2" aria-labelledby="lesson-2-h" tabIndex={0} hidden={!shown(1)}
        ref={(el) => { cards.current[1] = el }} onKeyDown={(e) => jump(e, 1)}>
        <div className="lesson-no">Lesson 2 · Agents</div>
        <h2 id="lesson-2-h">Agents</h2>
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

      <article className="lesson" id="lesson-3" aria-labelledby="lesson-3-h" tabIndex={0} hidden={!shown(2)}
        ref={(el) => { cards.current[2] = el }} onKeyDown={(e) => jump(e, 2)}>
        <div className="lesson-no">Lesson 3 · Ports & Services</div>
        <h2 id="lesson-3-h">Services, ports and protocols</h2>
        <p className="thesis">Every program that talks to the outside world opens a TCP port. On a headless server, ports are the entire surface.</p>
        <p>
          A port is a numbered socket on one IP address. Each running service claims one and answers HTTP
          (or another protocol) there. The scanner in this app reads the kernel's list of open ports every 30
          seconds. What's typically here, and what each one means — each line carries its live count, read
          from <code>/api/services/</code> while you look:
        </p>
        <ul>
          <li><span className="kbd">:22</span> SSH — administrative access. Everything else is downstream of someone having had it. <LiveChip n={count(s => s.port === 22)} title="counted live from /api/services/" /></li>
          <li>A band of web apps (this one among them) on ports near <span className="kbd">:8000</span>–<span className="kbd">:9000</span>, each a FastAPI server on a React build. <LiveChip n={count(s => s.port >= 8000 && s.port <= 9999)} title="listeners on 8000–9999, counted live" /></li>
          <li>A model runtime on <span className="kbd">:11434</span> for local inference. <LiveChip n={count(s => s.port === 11434)} title="listener on 11434, counted live" /></li>
          <li>Agent control ports — deliberately bound to localhost, never public. <LiveChip n={count(s => !s.public && s.port !== 22 && s.port !== 11434 && !(s.port >= 8000 && s.port <= 9999))} title="localhost-bound listeners outside the other rows, counted live" /></li>
          <li>The live list, with names and binds for this server, is one call away: <a className="kbd" href="/api/services/">/api/services/</a>{services !== null && <> — <b>{services.length}</b> listeners on the last scan</>}</li>
        </ul>
        <p>
          How processes are kept alive matters too: <strong>systemd</strong> and <strong>systemd user services</strong>
          {' '}restart agents and gateways if they die; <strong>docker</strong> wraps services with their dependencies
          (databases, queues, workflow engines) into containers; <strong>cron</strong> wakes jobs on a schedule —
          like the dashboards that regenerate hourly.
        </p>
        <div className="takeaway"><b>Takeaway</b> Ask "what's listening, and on which interface?" — the answer is a near-complete map of any server. That question is literally this app's scanner, and <a href="/guide">the build-your-own guide</a> walks its five functions step by step.</div>
      </article>

      <article className="lesson" id="lesson-4" aria-labelledby="lesson-4-h" tabIndex={0} hidden={!shown(3)}
        ref={(el) => { cards.current[3] = el }} onKeyDown={(e) => jump(e, 3)}>
        <div className="lesson-no">Lesson 4 · Permissions</div>
        <h2 id="lesson-4-h">Who can do what</h2>
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

      <article className="lesson" id="lesson-5" aria-labelledby="lesson-5-h" tabIndex={0} hidden={!shown(4)}
        ref={(el) => { cards.current[4] = el }} onKeyDown={(e) => jump(e, 4)}>
        <div className="lesson-no">Lesson 5 · Signal</div>
        <h2 id="lesson-5-h">How messages move</h2>
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
          The local half of that sentence is metered, not asserted: every listening port on this machine
          gets a loopback handshake probe from the scanner itself — three probes, a stated ceiling, the
          median of what answers.{' '}
          {lat === null ? (
            <span className="muted">first probe block pending — the numbers land with the next scan.</span>
          ) : hopMs.length === 0 ? (
            <span className="muted">nothing has answered the probe yet — a stated gap, never a fake zero.</span>
          ) : (
            <>
              This scan answered <b>{hits} of {probes}</b> probes; the median answered hop took{' '}
              <b>{medHop!.toFixed(2)} ms</b> and the slowest <b>{slowHop!.toFixed(2)} ms</b>. None of
              these hops leaves the machine — the number is the adjective. Live source:{' '}
              <a className="kbd" href="/api/latency/">/api/latency/</a>
            </>
          )}
        </p>
        <p>
          And the path is not a demo — it runs whether anyone is reading or not.{' '}
          {held.length === 0 ? (
            <span className="muted">the 24-hour rollup is still filling.</span>
          ) : (
            <>
              {Math.min(...held) === Math.max(...held) ? (
                <>It held exactly <b>{held[0]}</b> listeners in every one of the <b>{held.length}</b>{' '}
                recorded hours of the last day — a steady machine is the point of a machine.</>
              ) : (
                <>The recorder held between <b>{Math.min(...held)} and {Math.max(...held)}</b> listeners
                in each of the <b>{held.length}</b> recorded hours of the last day — the services that
                stand ready to take a message to sleep.</>
              )}{' '}
              Source:{' '}
              <a className="kbd" href="/api/trends/?hours=24&metrics=services">/api/trends/ · services</a>
            </>
          )}
        </p>
        <p>
          Note the split: model calls are remote, but tools, memory and files are local — and their effects
          are real, at the measured speeds above. <a href="/signal-flow">The Signal Flow page</a> draws
          this loop hop by hop, with the same probe numbers on every row.
        </p>
        <div className="takeaway"><b>Takeaway</b> An agent's model calls are remote HTTP; its tools and files are local. The signal path is where the two meet — and the local half of it is measured, hour after hour, by this very scanner.</div>
      </article>

      <article className="lesson" id="lesson-6" aria-labelledby="lesson-6-h" tabIndex={0} hidden={!shown(5)}
        ref={(el) => { cards.current[5] = el }} onKeyDown={(e) => jump(e, 5)}>
        <div className="lesson-no">Lesson 6 · Storage</div>
        <h2 id="lesson-6-h">How data persists</h2>
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

      {/* Stated gap, the house style: a search with no answer says so and
          offers the way out — never an empty page that looks broken. */}
      {norm !== '' && visible.length === 0 && (
        <div className="lesson-no-hits">
          <p>No lesson text contains “{query.trim()}”. The six lessons cover{' '}
            {LESSON_NAMES.join(', ').toLowerCase()}.</p>
          <button className="search-clear" onClick={() => { setQuery(''); }}>Clear the search</button>
        </div>
      )}
    </div>
  )
}
