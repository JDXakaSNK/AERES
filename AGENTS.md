# AERES — permanent Codex instructions

You are building **AERES**, a simulation-only autonomous emergency response concept by **GlobeTrotta**. The repository is a research/prototype project, not an operating emergency service.

## Product goal
Create a polished, responsive, technically honest mission-control prototype: simulated drone fleet; virtual AED, LED, and medical supply payloads; incident queue; human-approved assignments; virtual journey and telemetry; 2D/3D digital-twin visualization; operator audit log.

## Existing code
- `backend/app`: Python FastAPI, typed Pydantic contracts, deterministic in-memory simulator, REST + WebSocket updates.
- `frontend/src`: React + TypeScript + Vite, mission dashboard, SVG map and React Three Fiber synthetic 3D model.
- `backend/tests`: baseline test suite.
- `docs`: architecture, API, roadmap, future database.

## Non-negotiable safety boundaries
- Maintain the **SIMULATION_ONLY** flag and prominent permanent non-operational banner.
- Never connect to physical aircraft, PX4, ArduPilot, radio links, docking stations, commercial drone APIs, sensors, real cameras, real users' location or live medical devices in this MVP.
- No automatic dispatch. Dispatch requires deliberate, informed confirmation by a simulated human operator. An AI score may advise, but must not independently approve or execute.
- No emergency calling, no real 112/118 integrations, no ambulance routing, no emergency notifications, no patient diagnosis, no treatment guidance, no AED triggering or payload release.
- Never represent demo coordinates/ETA/battery as measured real values.
- Do not claim compliance, certification or life-saving efficacy. Require independent regulatory, privacy and clinical review for any real trial.
- Keep backend bound to localhost in local development. No live deployment until auth, authorization, rate limits, threat model and privacy review are implemented.

## Engineering requirements
- Prefer clear small modules and typed contracts; preserve graceful error states.
- Write tests when adding business rules or API endpoints; run `pytest` and frontend build.
- Avoid commercial tokens: synthetic map may operate offline, using no paid map API keys.
- Accessible UI: keyboard navigation, readable contrast, mobile responsive, reduced motion considerations.
- Keep all sample/demo data invented, non-identifying; no real incident reports.
- Document reasons for every external dependency and never commit keys.

## Suggested next tasks
1. Add durable persistence using PostgreSQL/PostGIS and Alembic while preserving simulation reset.
2. Introduce RBAC and synthetic operator identities; immutable audit event sequencing.
3. Add user-selectable scenario playback, incident creation with synthetic inputs and scenario fixtures.
4. Add deterministic environmental simulation, geofence constraints and return-path validation (advisory only).
5. Implement frontend and backend CI, Playwright screenshots and accessibility tests.
6. Explore official approvals and an accredited operational partner **outside** the software MVP.
