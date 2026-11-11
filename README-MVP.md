# AERES — Mission Control Simulator

**Autonomous Emergency Response System · powered by GlobeTrotta**

This directory is a **software demonstration**, not an emergency response product or flight controller. It includes a simulated fleet of AED, LED and medical delivery drones. All events, locations, ETA, battery percentages and journey telemetry are virtual.

## Features
- Mission Control dashboard, fleet and incident cards, activity history
- Synthetic geographic overview in interactive 2D/3D
- Simulated AED, LED and medical transport scenarios
- Operator-confirmed dispatch; explicit payload compatibility and virtual-battery checks
- Animated progress through **en_route → on_scene → returning → completed**
- FastAPI REST + WebSocket stream, automated backend tests

## Local quick start
**Python 3.11+ and Node 20+ recommended**. Run commands in separate terminals from the project root.

### Backend
```bash
cd backend
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API documentation: `http://127.0.0.1:8000/docs`.

### Tests
```bash
cd backend && python -m pytest -q
cd frontend && npm run build
```

## Directory
```text
AGENTS.md                Codex project rules
CODEX_TASK.md            Build prompt and milestones
backend/app/             FastAPI models, simulation and HTTP/WebSocket handlers
backend/tests/           API and simulation unit tests
frontend/src/            React/TypeScript UI, 2D map, 3D mock scene
.github/workflows/       CI workflow
docs/                    Architecture, security scope, product roadmap, SQL draft
```

## Important limitations
- This demo cannot fly drones or contact real emergency services.
- The dashboard is not suitable for dispatch, patient data, triage or actual incidents.
- No identity/authentication layer, operational database, incident reporting or certified safety case has been implemented.
- The 3D map is a **stylized synthetic digital twin**, not photogrammetry or an official aviation chart.
- Any future use needs a new system design, formal hazard analysis, operational partners and the applicable approvals.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`CODEX_TASK.md`](CODEX_TASK.md) for the fuller plan.
