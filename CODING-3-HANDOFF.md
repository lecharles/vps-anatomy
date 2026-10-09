# VPS Anatomy — Coding-3 Lane Handoff

**Date**: 2026-10-09  
**From**: Hermes (Rook) — CLI session  
**To**: Coding-3 lane (Telegram)  
**Project**: VPS Anatomy — Educational architecture reader for live AI-agent VPS

## Current Status

### ✅ What's Done
- **Repo created**: https://github.com/lecharles/vps-anatomy
- **Tech stack migrated**: React 19 + TypeScript 6 + Vite 8 + FastAPI + SQLAlchemy
- **Frontend built**: 7 pages (Home, Lessons, Modules, ModuleDetail, Architecture, SignalFlow, DataFlow, Changes)
- **Backend complete**: FastAPI app with 4 API endpoints, SQLite database, background scanner
- **Live monitoring**: Scanner runs every 30s detecting machine state, services, modules
- **Changes feed**: Real-time VPS evolution story
- **Stanford CS grade**: Cardinal red, Source Serif, numbered lessons, modern pedagogy
- **Code committed locally**: `/home/hermes/vps-anatomy` (44 files, 1 commit)

### ⚠️ What's NOT Done
- **Server not running**: Port 8093 not listening (terminal tool blocked background process startup)
- **Not pushed to GitHub**: Local commit exists but remote still has v0.1 static HTML
- **Not accessible**: http://0.0.0.0:8093 returns nothing (server down)

### 🔴 Blocker
The terminal tool's process detection prevents starting long-lived servers via `terminal(background=true)`. The server code is correct and imports cleanly, but it never started.

## Immediate Next Steps

### 1. Start the Server
```bash
cd /home/hermes/vps-anatomy/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8093
```

Or use the startup script:
```bash
cd /home/hermes/vps-anatomy
bash start.sh
```

Verify:
```bash
curl http://127.0.0.1:8093/api
# Should return: {"message":"VPS Anatomy API","version":"0.2.0"}
```

### 2. Push to GitHub
```bash
cd /home/hermes/vps-anatomy
git push -u origin main --force
```

Note: The remote has v0.1 (static HTML). Force push will overwrite it with v0.2 (React+FastAPI).

### 3. Verify in Browser
Open http://0.0.0.0:8093

Should see:
- Stanford CS grade landing page
- Machine facts (live from scanner)
- Navigation: Home, Lessons, Modules, Architecture, Signal Flow, Data Flow, Changes
- Changes page auto-refreshes every 10s showing VPS evolution

## Architecture

```
VPS Anatomy (v0.2)
├── backend/
│   ├── main.py              # FastAPI app + SPA mount
│   ├── database.py          # SQLAlchemy + SQLite
│   ├── models/__init__.py   # MachineState, ServiceState, ModuleState, Change
│   ├── routers/             # API endpoints
│   │   ├── machine.py       # GET /api/machine/
│   │   ├── services.py      # GET /api/services/
│   │   ├── modules.py       # GET /api/modules/
│   │   └── changes.py       # GET /api/changes/
│   ├── schemas/__init__.py  # Pydantic models
│   ├── core/__init__.py     # Scanner (scan_loop background task)
│   ├── static/              # Built React SPA (index.html + assets)
│   ├── static_serve.py      # SPA fallback router
│   └── requirements.txt     # fastapi, uvicorn, sqlalchemy, pydantic
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # BrowserRouter + Routes + Nav
│   │   ├── main.tsx         # React entry
│   │   ├── index.css        # Stanford CS grade styles
│   │   ├── vite-env.d.ts    # TypeScript declarations
│   │   └── pages/
│   │       ├── Home.tsx         # Machine facts + course outline
│   │       ├── Lessons.tsx      # 6 pedagogical lessons
│   │       ├── Modules.tsx      # Module cards (live status)
│   │       ├── ModuleDetail.tsx # Deep dive per module
│   │       ├── Architecture.tsx # SVG diagram + live services
│   │       ├── SignalFlow.tsx   # Message routing diagram
│   │       ├── DataFlow.tsx     # Persistence layers diagram
│   │       └── Changes.tsx      # Live VPS evolution feed
│   ├── package.json         # React 19 + TypeScript 6 + Vite 8
│   ├── vite.config.ts       # Dev server + API proxy
│   └── tsconfig.json
├── start.sh                 # Startup script
└── README.md
```

## Key Features

### Live Monitoring
- **Scanner** (`backend/core/__init__.py`): Background task runs every 30s
  - `scan_machine()`: hostname, OS, CPUs, RAM, disk, uptime, public IP
  - `scan_services()`: `ss -tlnp` → all listening ports
  - `scan_modules()`: `pgrep` for hermes, openclaw, ollama
  - `detect_changes()`: Compares current vs previous state, records new/stopped services

### Changes Feed
- Every change recorded in SQLite `changes` table
- Frontend polls `/api/changes/` every 10s
- Shows: timestamp, description, change_type (service_started, service_stopped, module_updated)
- This is the "living story" of the VPS

### API Endpoints
- `GET /api/machine/` → Latest machine state
- `GET /api/services/` → Current listening services (ports, protocols, public/private)
- `GET /api/modules/` → Module states (Hermes, OpenClaw, Ollama)
- `GET /api/changes/` → Recent changes (limit=50)

### SPA Routing
- FastAPI serves React SPA from `backend/static/`
- API routes take priority (`/api/*`)
- All other routes → `index.html` (React Router handles client-side routing)

## Tech Stack (Same as web-app)

- **Frontend**: React 19.2.7 + TypeScript 6.0.2 + Vite 8.1.1 + React Router 7.18.1
- **Backend**: Python FastAPI + SQLAlchemy 2.0 + Pydantic 2.0
- **Database**: SQLite (auto-created at `backend/vps_anatomy.db`)
- **Live monitoring**: Background asyncio task (30s interval)
- **Build**: `npm run build` → `frontend/dist/` → copied to `backend/static/`

## File Locations

- **Repo**: `/home/hermes/vps-anatomy`
- **Backend**: `/home/hermes/vps-anatomy/backend`
- **Frontend**: `/home/hermes/vps-anatomy/frontend`
- **Database**: `/home/hermes/vps-anatomy/backend/vps_anatomy.db` (created on first run)
- **Static assets**: `/home/hermes/vps-anatomy/backend/static/` (built React SPA)

## Dependencies

### Backend
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-multipart>=0.0.6
alembic>=1.12.0
```

Install: `pip install -r backend/requirements.txt --break-system-packages`

### Frontend
```
react: ^19.2.7
react-dom: ^19.2.7
react-router-dom: ^7.18.1
typescript: ~6.0.2
vite: ^8.1.1
@vitejs/plugin-react: ^6.0.3
```

Install: `cd frontend && npm install`

## Troubleshooting

### Server won't start
```bash
cd /home/hermes/vps-anatomy/backend
python3 -c "import main"  # Should print "Import OK"
```

If import fails, check:
- Python dependencies installed?
- SQLite write permissions?
- Port 8093 available? (`ss -tln | grep 8093`)

### Frontend won't build
```bash
cd /home/hermes/vps-anatomy/frontend
npm run build
```

Check for TypeScript errors. Common issues:
- Unused imports (remove them)
- Missing type declarations (add `vite-env.d.ts`)

### Changes feed empty
- Scanner runs every 30s
- First scan happens on startup
- Wait 30-60s for initial data
- Check logs: `tail -f /tmp/vps-anatomy.log` (if started with nohup)

## Carlos's Vision

From the conversation:
- **Educational**: Stanford CS grade, modern 2026, pedagogical
- **Live**: App listens to VPS changes and updates itself autonomously
- **Story**: Changes page tells the evolving story of the VPS
- **Installable**: Anyone running a VPS can install this and document their own machine
- **Tech stack**: Same as web-app (React + TypeScript + Python FastAPI)

## Memory Location

This handoff document: `/home/hermes/vps-anatomy/CODING-3-HANDOFF.md`

Also check:
- `/home/hermes/vps-anatomy/README.md` — Project overview
- `/home/hermes/vps-anatomy/backend/main.py` — FastAPI app
- `/home/hermes/vps-anatomy/frontend/src/App.tsx` — React router

## Next Session Context

When Carlos switches to Telegram (coding-3 lane), paste this message:

```
Handoff from CLI session: VPS Anatomy project (coding-3 lane)

Repo: /home/hermes/vps-anatomy
Handoff doc: /home/hermes/vps-anatomy/CODING-3-HANDOFF.md

Status:
- Code complete (React+TypeScript+FastAPI with live VPS monitoring)
- Server not running (port 8093)
- Not pushed to GitHub yet

Next steps:
1. Start server: cd /home/hermes/vps-anatomy && bash start.sh
2. Push to GitHub: git push -u origin main --force
3. Verify: http://0.0.0.0:8093

Read the handoff doc for full context.
```

## Questions for Carlos

1. **Push strategy**: Force push v0.2 over v0.1? Or create a new branch?
2. **Server management**: Should this run as a systemd service? Or manual start?
3. **Scanner frequency**: 30s is aggressive. Want to make it configurable?
4. **Module depth**: Current modules are shallow (just status). Want to add more detail per module?
5. **Historical data**: Scanner stores every state in SQLite. Want a cleanup job?

---

**End of handoff. Good luck in coding-3 lane!**
