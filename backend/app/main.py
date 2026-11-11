"""Simulation API. Never connects to drones, aircraft systems or emergency services."""
import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .models import DispatchRequest, Snapshot
from .store import Simulator

simulator = Simulator()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async def virtual_clock():
        while True:
            await asyncio.sleep(1)
            simulator.tick()

    clock = asyncio.create_task(virtual_clock())
    try:
        yield
    finally:
        clock.cancel()
        with suppress(asyncio.CancelledError):
            await clock


app = FastAPI(title="AERES Simulation API", version="0.1.0", lifespan=lifespan,
              description="Demo only. No aircraft or official emergency service integration.")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "SIMULATION_ONLY"}


@app.get("/api/snapshot", response_model=Snapshot)
def snapshot():
    return simulator.snapshot()


@app.post("/api/dispatch", response_model=Snapshot)
def dispatch(request: DispatchRequest):
    return simulator.dispatch(request)


@app.post("/api/resolve/{incident_id}", response_model=Snapshot)
def resolve(incident_id: str):
    return simulator.resolve(incident_id)


@app.post("/api/reset", response_model=Snapshot)
def reset():
    return simulator.reset()


@app.websocket("/ws")
async def websocket_updates(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(simulator.snapshot().model_dump(mode="json"))
            await asyncio.sleep(1)
    except (WebSocketDisconnect, RuntimeError):
        return
