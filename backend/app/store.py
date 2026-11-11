"""Deterministic in-memory flight *visualization*, never a flight-control system."""
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException

from .models import DispatchRequest, Drone, Event, Incident, Mission, Position, Snapshot

# Accelerated *virtual* time. This does not model real-world flight performance.
VIRTUAL_SECONDS_PER_TICK = 15.0


def now() -> datetime:
    return datetime.now(timezone.utc)


def distance_km(a: Position, b: Position) -> float:
    radius_km = 6371.0
    lat_delta = radians(b.lat - a.lat)
    lon_delta = radians(b.lon - a.lon)
    arc = sin(lat_delta / 2) ** 2 + cos(radians(a.lat)) * cos(radians(b.lat)) * sin(lon_delta / 2) ** 2
    return 2 * radius_km * asin(sqrt(arc))


def interpolate(a: Position, b: Position, fraction: float) -> Position:
    p = max(0.0, min(1.0, fraction))
    return Position(lat=a.lat + (b.lat - a.lat) * p, lon=a.lon + (b.lon - a.lon) * p)


class Simulator:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> Snapshot:
        self.drones = {
            d.id: d for d in [
                Drone(id="AER-01", name="Falco AED", payload="AED", status="idle", battery=94,
                      speed_kmh=72, position=Position(lat=45.625, lon=8.846), base=Position(lat=45.625, lon=8.846)),
                Drone(id="AER-02", name="Lumen One", payload="LED", status="idle", battery=86,
                      speed_kmh=67, position=Position(lat=45.612, lon=8.902), base=Position(lat=45.612, lon=8.902)),
                Drone(id="AER-03", name="Med Courier", payload="MEDICAL", status="idle", battery=91,
                      speed_kmh=60, position=Position(lat=45.572, lon=8.977), base=Position(lat=45.572, lon=8.977)),
            ]
        }
        self.incidents = {
            i.id: i for i in [
                Incident(id="EVT-104", kind="AED", title="Supporto AED", description="Scenario simulato · Area industriale",
                         location=Position(lat=45.597, lon=8.879), priority="critical", status="pending"),
                Incident(id="EVT-105", kind="LED", title="Segnalazione incidente", description="Scenario simulato · Rete stradale",
                         location=Position(lat=45.594, lon=8.946), priority="high", status="pending"),
                Incident(id="EVT-106", kind="MEDICAL", title="Consegna sanitaria", description="Scenario simulato · Presidio medico",
                         location=Position(lat=45.548, lon=8.951), priority="medium", status="pending"),
            ]
        }
        self.missions: dict[str, Mission] = {}
        self._mission_origin: dict[str, Position] = {}
        self._sequence = 0
        self.events = [Event(at=now(), message="Ambiente dimostrativo pronto: nessun velivolo collegato.", kind="info")]
        return self.snapshot()

    def snapshot(self) -> Snapshot:
        return Snapshot(drones=list(self.drones.values()), incidents=list(self.incidents.values()),
                        missions=list(self.missions.values()), events=list(reversed(self.events[-20:])))

    def event(self, message: str, kind: str = "info") -> None:
        self.events.append(Event(at=now(), message=message, kind=kind))

    def dispatch(self, request: DispatchRequest) -> Snapshot:
        if not request.operator_confirmed:
            raise HTTPException(status_code=400, detail="È necessaria una conferma esplicita dell'operatore.")
        incident = self.incidents.get(request.incident_id)
        drone = self.drones.get(request.drone_id)
        if incident is None or drone is None:
            raise HTTPException(status_code=404, detail="Drone o evento non trovato.")
        if incident.status != "pending":
            raise HTTPException(status_code=409, detail="L'evento è già assegnato o chiuso.")
        if drone.status != "idle":
            raise HTTPException(status_code=409, detail="Il drone virtuale non è disponibile.")
        if drone.payload != incident.kind:
            raise HTTPException(status_code=409, detail="Payload incompatibile con lo scenario.")
        if drone.battery < 30:
            raise HTTPException(status_code=409, detail="Batteria simulata sotto la soglia demo.")

        self._sequence += 1
        mission_id = f"SIM-{self._sequence:04d}"
        travel_seconds = max(40.0, 20.0 + 3600.0 * distance_km(drone.position, incident.location) / drone.speed_kmh)
        self._mission_origin[mission_id] = drone.position.model_copy(deep=True)
        mission = Mission(id=mission_id, drone_id=drone.id, incident_id=incident.id,
                          status="en_route", travel_seconds=travel_seconds, created_at=now())
        self.missions[mission_id] = mission
        drone.status = "en_route"
        incident.status = "assigned"
        self.event(f"{mission_id}: missione virtuale approvata per {drone.name}.", "success")
        return self.snapshot()

    def resolve(self, incident_id: str) -> Snapshot:
        incident = self.incidents.get(incident_id)
        if incident is None:
            raise HTTPException(status_code=404, detail="Evento non trovato.")
        if incident.status != "on_scene":
            raise HTTPException(status_code=409, detail="L'evento può essere chiuso solo quando il drone simulato è arrivato.")
        mission = next((m for m in self.missions.values() if m.incident_id == incident_id and m.status == "on_scene"), None)
        if mission is None:
            raise HTTPException(status_code=409, detail="Missione attiva non trovata.")
        mission.status = "returning"
        mission.elapsed_seconds = 0
        mission.progress = 0
        drone = self.drones[mission.drone_id]
        drone.status = "returning"
        incident.status = "resolved"
        self.event(f"{mission.id}: evento virtuale chiuso; rientro simulato.", "success")
        return self.snapshot()

    def tick(self) -> None:
        for mission in self.missions.values():
            if mission.status not in ("en_route", "returning"):
                continue
            mission.elapsed_seconds += VIRTUAL_SECONDS_PER_TICK
            mission.progress = min(1.0, mission.elapsed_seconds / mission.travel_seconds)
            drone = self.drones[mission.drone_id]
            incident = self.incidents[mission.incident_id]
            if mission.status == "en_route":
                drone.position = interpolate(self._mission_origin[mission.id], incident.location, mission.progress)
                if mission.progress >= 1:
                    mission.status = "on_scene"
                    incident.status = "on_scene"
                    drone.status = "on_scene"
                    self.event(f"{mission.id}: arrivo virtuale allo scenario.", "success")
            else:
                drone.position = interpolate(incident.location, drone.base, mission.progress)
                if mission.progress >= 1:
                    mission.status = "completed"
                    drone.status = "idle"
                    drone.battery = max(0, drone.battery - 12)  # Simulated consumption, not a flight model.
                    self.event(f"{mission.id}: rientro virtuale completato.")
