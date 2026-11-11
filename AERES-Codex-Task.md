# Codex build brief — AERES Mission Control

## Immediate mission
Starting from the repository's existing code, deliver a polished, runnable **simulation-only** web MVP for the emergency drone concept. Keep it locally runnable with free/open-source tooling and no credentials. Do not replace the owner's existing README/banner/ASCII branding; instead add navigation links to these new docs if requested.

### What already exists
- FastAPI backend, accelerated virtual simulation, REST routes, WebSocket snapshots, and backend tests.
- React + TypeScript control center, simulated event cards, drone cards, 2D synthetic coordinates and optional 3D scene.
- Operator-confirmed virtual dispatch and virtual resolution.

### Your tasks, in order
1. Install dependencies and run `cd backend && python -m pytest -q` plus `cd frontend && npm install && npm run build`. Fix any compile/runtime issues first.
2. Check front end visually in desktop 1440×900 and mobile 390×844. Improve spacing and typography without removing simulation warning.
3. Refactor large components into smaller typed components; preserve API compatibility.
4. Add Playwright smoke tests for initial dashboard, 2D/3D toggle, operator confirmation, dispatch and reset.
5. Add persisted mock scenarios in JSON and deterministic seed selector, but do not add real-world alerts.
6. Add backend database repository abstraction and Alembic migrations for future PostgreSQL/PostGIS, without requiring PostgreSQL to launch the demo.
7. Update the README with quick-start commands, app screenshot, architecture overview and safety disclaimer.

### Acceptance criteria
- Backend and frontend start locally with one command per service.
- API remains simulation-only; all mission activation is manual and simulated.
- An operator can dispatch compatible idle virtual drones, see positions update, see on-scene state, resolve, then observe virtual return.
- Incompatible payload, low simulated battery, duplicate assignment and missing operator confirmation are rejected.
- Responsive layout and accessible keyboard controls; clear loading and error states.
- No production claim, real emergency integrations, aviation operations or live hardware support.
- CI checks pass; no secrets.

### Suggested development setup
Terminal A:

```bash
cd backend
python -m venv .venv
# activate .venv (Windows: .venv\\Scripts\\activate; macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal B:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Backend OpenAPI at http://127.0.0.1:8000/docs.

### Future milestone, not part of this MVP
When pursuing real field tests, commission qualified safety, aviation and medical-device specialists to evaluate the exact aircraft, operator concept, flight geography, technical failsafes, telemetry, GDPR and emergency-system cooperation. Software in this repo does not establish any approval or suitability for such operations.
