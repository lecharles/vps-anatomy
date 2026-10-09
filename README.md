# VPS Anatomy

A self-observing educational app for a live AI-agent server. A background
scanner reads the machine every 30 seconds — CPU, memory, disk, uptime, TCP
listeners, running processes — and stores each scan in SQLite. The site then
teaches the architecture of the machine using that data, not screenshots of
someone's memory: what's listening on each port, which agents are alive, and
what changed between scans.

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
  routers/           /api/machine /api/services /api/modules /api/changes
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

Frontend is one hook (`useApi`) polling four endpoints, and pages that render
that state. The Data Flow page draws its own SVG sequence diagram; nothing
here is a mock.

## API

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/machine/` | latest hardware/OS facts |
| GET | `/api/machine/history` | scan history |
| GET | `/api/services/` | listeners from the newest scan |
| GET | `/api/services/history?port=` | listener history |
| GET | `/api/modules/` | residents with live/stopped status |
| GET | `/api/modules/{id}` | one resident |
| GET | `/api/changes/?limit=` | the change log |
| GET | `/openapi.json` | schema |

Interactive reference with the same themes: **`/docs`**.

## Run

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8093
```

The database is created on first start. The scanner runs inside the app
process; no separate worker. To rebuild the frontend:

```bash
cd frontend && npm install && npm run build
rm -rf ../backend/static/* && cp -r dist/* ../backend/static/
```

## Notes on public data

Run `scripts/hygiene.sh` before pushing (CI runs it too): it fails the build on
secret-like strings, private working files, brand claims, or personal
narration in tracked content.

This repo documents a specific real server: hostname, IP, open ports, and
service names appear in the scanner output because the site's purpose is
showing them. Keep secrets, tokens, and private file contents out of the
catalog and scanner output; they would be published by the API the moment
they land.

## License

MIT
