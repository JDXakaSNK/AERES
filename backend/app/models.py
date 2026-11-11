"""Public data contracts for the simulation-only AERES demo."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Payload = Literal["AED", "LED", "MEDICAL"]
DroneStatus = Literal["idle", "en_route", "on_scene", "returning"]
IncidentStatus = Literal["pending", "assigned", "on_scene", "resolved"]
MissionStatus = Literal["en_route", "on_scene", "returning", "completed"]


class Position(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Drone(BaseModel):
    id: str
    name: str
    payload: Payload
    status: DroneStatus
    battery: int = Field(ge=0, le=100)
    speed_kmh: int = Field(gt=0)
    position: Position
    base: Position


class Incident(BaseModel):
    id: str
    kind: Payload
    title: str
    description: str
    location: Position
    priority: Literal["critical", "high", "medium"]
    status: IncidentStatus


class Mission(BaseModel):
    id: str
    drone_id: str
    incident_id: str
    status: MissionStatus
    travel_seconds: float
    elapsed_seconds: float = 0
    progress: float = Field(default=0, ge=0, le=1)
    created_at: datetime


class Event(BaseModel):
    at: datetime
    message: str
    kind: Literal["info", "warning", "success"] = "info"


class Snapshot(BaseModel):
    mode: Literal["SIMULATION_ONLY"] = "SIMULATION_ONLY"
    drones: list[Drone]
    incidents: list[Incident]
    missions: list[Mission]
    events: list[Event]


class DispatchRequest(BaseModel):
    incident_id: str
    drone_id: str
    operator_confirmed: bool = False
