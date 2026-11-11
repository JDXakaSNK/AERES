export type Payload = 'AED' | 'LED' | 'MEDICAL'
export type DroneStatus = 'idle' | 'en_route' | 'on_scene' | 'returning'
export type IncidentStatus = 'pending' | 'assigned' | 'on_scene' | 'resolved'
export type MissionStatus = 'en_route' | 'on_scene' | 'returning' | 'completed'
export type Position = { lat: number; lon: number }
export type Drone = {
  id: string
  name: string
  payload: Payload
  status: DroneStatus
  battery: number
  speed_kmh: number
  position: Position
  base: Position
}
export type Incident = {
  id: string
  kind: Payload
  title: string
  description: string
  location: Position
  priority: 'critical' | 'high' | 'medium'
  status: IncidentStatus
}
export type Mission = {
  id: string
  drone_id: string
  incident_id: string
  status: MissionStatus
  travel_seconds: number
  elapsed_seconds: number
  progress: number
  created_at: string
}
export type LogEvent = { at: string; message: string; kind: 'info' | 'warning' | 'success' }
export type Snapshot = {
  mode: 'SIMULATION_ONLY'
  drones: Drone[]
  incidents: Incident[]
  missions: Mission[]
  events: LogEvent[]
}
