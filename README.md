# VPS Anatomy

A self-observing educational app for a live AI-agent server. A background
scanner reads the server every 30 seconds — core count, total RAM, disk
usage, uptime, TCP listeners, resident processes — and stores each scan in
SQLite. The site then teaches the architecture of the server using that
data, not screenshots of someone's memory: what's listening on each port,
which agents are alive, and what changed between scans.

The project doubles as its own subject. The scanner that powers the diagrams
is described by the same diagrams, and the API reference at `/docs` is the
honest inventory of everything the site knows.

## Stack

- Frontend: React 19 + TypeScript + Vite, React Router. No component library; styles are semantic CSS custom properties (`frontend/src/index.css`) with three themes sharing one token contract.
- Backend: FastAPI + SQLAlchemy, SQLite.
- Monitoring: an asyncio loop in the app's lifespan that re-scans every 30s and diffs successive states into a change log.

## Layout

```
backend/
  main.py            app factory, OpenAPI metadata, /docs, SPA mount
  core/__init__.py   the scanner: machine facts, ss parsing, module probes, change diffing
  core/latency.py    loopback handshake probes — the median ms per listening port
  core/retention.py  daily job: hourly rollups to trend_hours, raw rows pruned past the window
  routers/           /api/machine /api/services /api/modules /api/changes /api/trends /api/latency
  models/ schemas/   SQLAlchemy tables + Pydantic response models
  static/            build output served by FastAPI (single origin, no CORS needed)
frontend/
  src/hooks/useApi.ts   fetch + poll helper
  src/hooks/useTheme.ts theme persistence (localStorage key: vps.theme)
  public/docs.html      themed Swagger page
  public/docs-theme.css design-system tokens applied to Swagger UI
```

## Reading the code

Start at `backend/core/__init__.py`. It is the whole domain:

1. `scan_machine()` — native reads (`/proc/meminfo`, `/proc/uptime`,
   `shutil.disk_usage`) chosen over parsing shell tools, because tool output
   formats vary between distros and broke the first version.
2. `scan_services()` — parses `ss -tlnp`. A port either matches the
   `SERVICE_CATALOG` (a port→meaning map) or is attributed by process name;
   root-owned listeners are reported as unattributed rather than guessed.
   That's the permissions lesson in Lesson 4, running live.
3. `scan_modules()` — liveness probes for the known residents (agents,
   Ollama, Docker, cron) via pgrep and local port checks.
4. `scan_loop()` — 30s cadence: diff against the previous scan (the change
   log), then persist machine/services/modules rows under one shared
   timestamp. The routers read "all rows at the latest timestamp."

Frontend is one hook (`useApi`) and pages that render its state — eight
distinct API paths in total, `/api/machine/` through
`/api/modules/{id}/sparkline`. The course pages are prose except where they
cite live numbers: Lesson 3 reads `/api/services/`, and Lesson 5 quotes
`/api/latency/` and `/api/trends/` in its copy. `/guide` teaches the same
scanner design generically, quoting this repo's source. The Data Flow page
draws its own SVG sequence diagram; nothing here is a mock.

## API

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/machine/` | latest hardware/OS facts |
| GET | `/api/machine/history` | scan history |
| GET | `/api/services/` | listeners from the newest scan |
| GET | `/api/services/history?port=` | listener history |
| GET | `/api/modules/` | residents with live/stopped status |
| GET | `/api/modules/{id}` | one resident |
| GET | `/api/modules/{id}/history?limit=` | one resident's raw scan rows, newest first |
| GET | `/api/modules/{id}/sparkline?hours=` | one resident's hourly live-share (scans vs live per UTC hour) — the module-detail sparkline |
| GET | `/api/changes/by-type/{type}?limit=` | the change log narrowed to one event type |
| GET | `/api/changes/?limit=` | the change log |
| GET | `/api/trends/?hours=&metrics=` | hourly rollups — distinct listeners, live residents, RAM/disk means; `metrics` picks series (`services,modules,ram,disk`) |
| GET | `/api/trends/export?hours=&metrics=` | the same rollup as a `text/csv` attachment — one computation, two serializations; unselected metrics get no column, unknown names still answer 422 |
| GET | `/api/latency/` | newest scan's loopback handshake medians, per port, in ms |
| GET | `/api/latency/history?port=` | hop-latency history, newest first |
| GET | `/healthz` | liveness — 200 while the scanner is writing, 503 when stale (see `scripts/boot-check.sh`) |
| GET | `/openapi.json` | schema |

Interactive reference with the same themes: **`/docs`**.

## Run

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8093
```

A production host has two paths, both self-observing:

- **Target: systemd.** `deploy/vps-anatomy.service` is the unit draft
  (restart-on-crash, start-on-boot, journald logs). Installing it needs a
  root session — the steps are in the file header. After any boot or
  enable, `scripts/boot-check.sh` proves the app and its scanner are
  actually writing again.
- **Current-host fallback: the launcher.** `launch-8093.sh` runs the same
  uvicorn command in a terminal multiplexer and appends stdout to a log
  file that rotates at 5 MB (one previous generation). It retires when
  the unit is enabled; until then, rotation is the launcher's job, so a
  long-running dashboard cannot fill the disk with its own log.

The database is created on first start. The scanner runs inside the app
process; no separate worker.

To rebuild the frontend:

```bash
cd frontend && npm install && npm run build && cd ..
bash scripts/deploy-static.sh
```

`scripts/deploy-static.sh` syncs `frontend/dist/` into `backend/static/`,
which FastAPI serves — one origin, no CORS in production.

To see what a visitor's browser actually downloads (raw vs gzip wire bytes,
with budgets), run `bash scripts/bundle-report.sh` against the app. Static
bodies over 1 KB are gzipped when the client asks for it.

To run the test suite:

```bash
pip install -r backend/requirements-dev.txt
python3 -m pytest
```

The scanner is tested with `ss -tlnp` fixtures and an in-memory database:
tests never run commands, never touch the network, and never open the live
app's database, so they are safe to run on the server itself.

## Notes on public data

This repository is a public engineering artifact: it ships the mechanism —
scanner, server, UI, tests — and nothing about any specific machine.
Host-local facts (port names, resident list, snapshots, databases) live in
gitignored files on the server (`backend/service_catalog.json`,
`backend/host_modules.json`, `data/`) and reach the UI only through the live
API at runtime — the machine row itself carries the host's own hostname and
public IP, which therefore never appear in committed content.
`scripts/hygiene.sh` runs before every push and fails on
secrets, IP literals, provider hostnames, product maps, and tracked
host-local files. The daily scheduled job is a local smoke test
(`scripts/smoke.sh`) that logs to the host and writes nothing to git.

## License

MIT
