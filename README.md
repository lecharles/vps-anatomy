# VPS Anatomy

**Educational architecture reader: learn the architecture of a live AI-agent VPS.**

A Stanford CS-grade web app that tells the story of a machine running multiple AI agents (Hermes, OpenClaw, OpenCode), services, and automation lanes. Modern, pedagogical, data-driven, and **alive** — it scans the VPS every 30 seconds and updates itself autonomously.

## Tech Stack

- **Frontend**: React 19 + TypeScript 6 + Vite 8 + React Router 7
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: SQLite (auto-created on first run)
- **Live monitoring**: Background scanner detects changes every 30s

## Quick Start

```bash
# Clone
git clone https://github.com/lecharles/vps-anatomy.git
cd vps-anatomy

# Install backend dependencies
cd backend
pip install -r requirements.txt --break-system-packages

# Build frontend (optional, pre-built in backend/static)
cd ../frontend
npm install
npm run build
cp -r dist ../backend/static

# Start the server
cd ../backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8093

# Open in browser
# http://0.0.0.0:8093
```

Or use the startup script:
```bash
bash start.sh
```

## Features

- **6 lessons** from general to specific: hardware, agents, plumbing, boundaries, signal flow, data flow
- **Live module monitoring**: Hermes, OpenClaw, Ollama status scanned every 30s
- **Architecture diagrams** (SVG): full system, signal flow, data flow
- **Changes feed**: real-time story of VPS evolution
- **Live services**: all listening ports detected and displayed
- **Installable**: run on your own VPS, edit the scanner, learn your machine

## API Endpoints

- `GET /api/machine/` — Latest machine state
- `GET /api/services/` — Current listening services
- `GET /api/modules/` — Module states (Hermes, OpenClaw, Ollama)
- `GET /api/changes/` — Recent changes (service started/stopped)

## Pages

- **Home**: Machine facts, course outline
- **Lessons**: 6 pedagogical lessons
- **Modules**: Deep dives into each component (live status)
- **Architecture**: Full system diagram + live services list
- **Signal Flow**: Message routing diagram
- **Data Flow**: Persistence layers diagram
- **Changes**: Live feed of VPS evolution (auto-refreshes every 10s)

## Live Monitoring

The backend runs a background task that scans every 30 seconds:
1. Machine facts (hostname, OS, CPUs, RAM, disk, uptime)
2. Listening services (via `ss -tlnp`)
3. Known modules (Hermes, OpenClaw, Ollama via `pgrep`)
4. Detects changes (new/stopped services)
5. Stores in SQLite
6. Changes page shows the live story

## License

MIT

## Author

Built by Hermes (Rook) for Carlos (lecharles).
