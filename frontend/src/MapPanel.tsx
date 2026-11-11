import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import type { Drone, Incident, Mission, Payload, Position } from './types'

const area = { minLat: 45.52, maxLat: 45.66, minLon: 8.8, maxLon: 9.07 }
const palette: Record<Payload, string> = { AED: '#f97380', LED: '#fbbf5a', MEDICAL: '#4ddac7' }
const xy = (p: Position) => ({
  x: ((p.lon - area.minLon) / (area.maxLon - area.minLon)) * 100,
  y: (1 - (p.lat - area.minLat) / (area.maxLat - area.minLat)) * 100,
})
const xyz = (p: Position): [number, number, number] => {
  const t = xy(p)
  return [(t.x - 50) * 0.30, 0.65, (t.y - 50) * 0.30]
}

function FlatMap({ drones, incidents, missions }: Props) {
  const getDrone = (id: string) => drones.find((drone) => drone.id === id)
  const getIncident = (id: string) => incidents.find((incident) => incident.id === id)
  return (
    <div className="flat-map" aria-label="Mappa schematica di posizioni simulate">
      <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="map-underlay" aria-hidden="true">
        <defs>
          <pattern id="grid" width="55" height="55" patternUnits="userSpaceOnUse">
            <path d="M55 0H0V55" stroke="#2f6680" strokeWidth="0.8" opacity="0.25" fill="none" />
          </pattern>
          <linearGradient id="mapGlow" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#123854" />
            <stop offset="1" stopColor="#071727" />
          </linearGradient>
        </defs>
        <rect width="1000" height="600" fill="url(#mapGlow)" />
        <rect width="1000" height="600" fill="url(#grid)" />
        <path d="M-40 100 Q220 245 420 95 T1070 140 M-20 530 Q200 350 450 435 T1050 320 M80 -20 L370 650 M730 -20 L600 650" fill="none" stroke="#3c7189" strokeWidth="12" opacity="0.16" />
        <path d="M-40 100 Q220 245 420 95 T1070 140 M-20 530 Q200 350 450 435 T1050 320 M80 -20 L370 650 M730 -20 L600 650" fill="none" stroke="#80bcd1" strokeWidth="1.7" opacity="0.22" strokeDasharray="10 8" />
        <path d="M80 390 Q290 260 420 340 T900 420" fill="none" stroke="#4ddac7" strokeWidth="30" opacity="0.045" />
        <text x="80" y="115" fill="#80a9c2" fontSize="21" opacity="0.6">AREA OPERATIVA VIRTUALE</text>
        <text x="735" y="535" fill="#80a9c2" fontSize="18" opacity="0.4">LOMBARDIA · DEMO</text>
      </svg>
      {missions.filter((mission) => mission.status !== 'completed').map((mission) => {
        const drone = getDrone(mission.drone_id)
        const incident = getIncident(mission.incident_id)
        if (!drone || !incident) return null
        const a = xy(drone.position); const b = xy(incident.location)
        return <svg className="mission-line" key={mission.id} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={palette[incident.kind]} strokeDasharray="1.5 1" strokeWidth="0.4" opacity="0.85" />
        </svg>
      })}
      {incidents.filter((incident) => incident.status !== 'resolved').map((incident) => {
        const p = xy(incident.location)
        return <div className={`map-pin incident-pin ${incident.priority}`} key={incident.id}
          style={{ left: `${p.x}%`, top: `${p.y}%`, ['--pin-color' as string]: palette[incident.kind] }}
          title={`${incident.id}: ${incident.title} (simulazione)`}>
          <span className="pin-core">!</span><span className="pin-label">{incident.id} · {incident.kind}</span>
        </div>
      })}
      {drones.map((drone) => {
        const p = xy(drone.position)
        return <div className="map-pin drone-pin" key={drone.id} style={{ left: `${p.x}%`, top: `${p.y}%` }}
          title={`${drone.name}, ${drone.status}`}><span className="pin-core">✦</span><span className="pin-label">{drone.id}</span></div>
      })}
      <div className="map-scale">SCHEMATIC VIEW · NOT FOR NAVIGATION</div>
    </div>
  )
}

function SceneMap({ drones, incidents }: Props) {
  return <div className="scene-map" role="img" aria-label="Gemello digitale 3D schematico, interamente simulato">
    <Canvas camera={{ position: [0, 23, 24], fov: 46 }}>
      <color attach="background" args={['#071928']} />
      <fog attach="fog" args={['#071928', 25, 65]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[8, 20, 6]} intensity={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[44, 44]} /><meshStandardMaterial color="#0c2336" />
      </mesh>
      <gridHelper args={[40, 25, '#28516b', '#183449']} position={[0, 0.01, 0]} />
      {Array.from({ length: 32 }, (_, i) => {
        const x = Math.sin(i * 21.7) * 14
        const z = Math.cos(i * 11.3) * 13
        const height = 0.5 + ((i * 7) % 6) * 0.3
        return <mesh key={`tower-${i}`} position={[x, height / 2, z]}>
          <boxGeometry args={[0.6 + (i % 3) * 0.2, height, 0.7]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#20445b' : '#163248'} metalness={0.24} roughness={0.65} />
        </mesh>
      })}
      {incidents.filter((incident) => incident.status !== 'resolved').map((incident) => {
        const p = xyz(incident.location)
        return <group key={incident.id} position={[p[0], 0.15, p[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.65, 0.045, 6, 40]} /><meshBasicMaterial color={palette[incident.kind]} />
          </mesh>
          <mesh position={[0, 0.5, 0]}><octahedronGeometry args={[0.35]} />
            <meshStandardMaterial color={palette[incident.kind]} emissive={palette[incident.kind]} emissiveIntensity={0.6} />
          </mesh>
        </group>
      })}
      {drones.map((drone) => {
        const p = xyz(drone.position)
        return <group key={drone.id} position={[p[0], drone.status === 'idle' ? 0.6 : 2.2, p[2]]}>
          <mesh><octahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color="#d5f5ff" emissive="#3daccf" emissiveIntensity={0.3} /></mesh>
          <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[1.75, 0.07, 0.22]} /><meshBasicMaterial color="#7bcfe6" /></mesh>
          <pointLight color="#7bcfe6" intensity={1} distance={4} />
        </group>
      })}
      <OrbitControls enablePan={false} minDistance={15} maxDistance={52} maxPolarAngle={Math.PI / 2.15} />
    </Canvas>
    <div className="map-scale">3D DIGITAL TWIN · SYNTHETIC GEOGRAPHY</div>
  </div>
}

type Props = { drones: Drone[]; incidents: Incident[]; missions: Mission[] }
export default function MapPanel(props: Props) {
  const [view, setView] = useState<'2D' | '3D'>('2D')
  return <section className="map-card">
    <div className="card-heading map-heading"><div><span className="eyebrow">GEOSPATIAL OVERVIEW</span><h2>Mission map</h2></div>
      <div className="view-toggle" role="group" aria-label="Modalità mappa">
        {(['2D', '3D'] as const).map((mode) => <button key={mode} type="button" aria-pressed={view === mode}
          onClick={() => setView(mode)} className={view === mode ? 'active' : ''}>{mode}</button>)}
      </div>
    </div>
    {view === '2D' ? <FlatMap {...props} /> : <SceneMap {...props} />}
    <div className="map-legend"><span><i className="legend-dot" style={{ background: '#d5f5ff' }} /> Drone</span>
      <span><i className="legend-dot" style={{ background: '#f97380' }} /> AED</span>
      <span><i className="legend-dot" style={{ background: '#fbbf5a' }} /> LED</span>
      <span><i className="legend-dot" style={{ background: '#4ddac7' }} /> Medical</span>
    </div>
  </section>
}
