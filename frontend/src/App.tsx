import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowUpRight, BatteryFull, CheckCircle2, ChevronRight,
  Clock3, Command, HeartPulse, Lightbulb, Package, Radar, RadioTower,
  RotateCcw, ShieldCheck, Wifi, WifiOff, Zap,
} from 'lucide-react'
import MapPanel from './MapPanel'
import type { Drone, DroneStatus, Incident, IncidentStatus, Payload, Snapshot } from './types'

const payloadIcon = { AED: HeartPulse, LED: Lightbulb, MEDICAL: Package }
const payloadLabel: Record<Payload, string> = { AED: 'Defibrillatore', LED: 'Luci d’emergenza', MEDICAL: 'Trasporto medicale' }
const statusLabel: Record<DroneStatus | IncidentStatus, string> = {
  idle: 'Disponibile', en_route: 'In volo · SIM', on_scene: 'Sul posto · SIM', returning: 'In rientro · SIM',
  pending: 'Da assegnare', assigned: 'Assegnato', resolved: 'Concluso',
}

async function request(path: string, options?: RequestInit): Promise<Snapshot> {
  const response = await fetch(path, options)
  if (!response.ok) {
    let details = `Errore HTTP ${response.status}`
    try { const body = await response.json(); details = body.detail || details } catch { /* preserve fallback */ }
    throw new Error(details)
  }
  return response.json() as Promise<Snapshot>
}

function Stat({ icon: Icon, label, value, footnote }: {
  icon: typeof Activity; label: string; value: string | number; footnote: string
}) {
  return <div className="stat-card"><div className="stat-upper"><span>{label}</span><Icon size={17} aria-hidden="true" /></div>
    <div className="stat-value">{value}</div><p>{footnote}</p></div>
}

function DroneRow({ drone }: { drone: Drone }) {
  const Icon = payloadIcon[drone.payload]
  return <div className="drone-row">
    <div className={`fleet-icon ${drone.payload.toLowerCase()}`}><Icon size={20} /></div>
    <div className="fleet-main"><strong>{drone.name}</strong><small>{drone.id} · {payloadLabel[drone.payload]}</small></div>
    <div className="fleet-right"><span className={`drone-state ${drone.status}`}><i />{statusLabel[drone.status]}</span>
      <span className="battery"><BatteryFull size={14} /> {drone.battery}%</span></div>
  </div>
}

function IncidentRow({ incident, drone, onDispatch, onResolve, busy }: {
  incident: Incident; drone?: Drone; onDispatch: (incident: Incident, drone: Drone) => void;
  onResolve: (id: string) => void; busy: boolean
}) {
  const Icon = payloadIcon[incident.kind]
  return <div className="incident-row">
    <div className="incident-header"><span className={`priority ${incident.priority}`}><i /> {incident.priority.toUpperCase()}</span>
      <small>{incident.id}</small></div>
    <div className="incident-content"><div className={`incident-type ${incident.kind.toLowerCase()}`}><Icon size={18} /></div>
      <div><strong>{incident.title}</strong><p>{incident.description}</p></div></div>
    <div className="incident-actions"><span className={`tag ${incident.status}`}>{statusLabel[incident.status]}</span>
      {incident.status === 'pending' && <button className="dispatch-btn" disabled={!drone || busy}
        onClick={() => drone && onDispatch(incident, drone)} title={!drone ? 'Nessun drone disponibile con questo payload' : undefined}>
        Simula invio <ArrowUpRight size={15} /></button>}
      {incident.status === 'on_scene' && <button className="dispatch-btn outline" disabled={busy} onClick={() => onResolve(incident.id)}>
        Chiudi scenario <CheckCircle2 size={15} /></button>}
    </div>
  </div>
}

export default function App() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let socket: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    const endpoint = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`
    const connect = () => {
      if (!active) return
      socket = new WebSocket(endpoint)
      socket.onopen = () => { if (active) { setConnected(true); setError(null) } }
      socket.onmessage = (message) => {
        try { if (active) setData(JSON.parse(message.data) as Snapshot) } catch { /* ignore malformed demo packets */ }
      }
      socket.onclose = () => { if (active) { setConnected(false); retryTimer = setTimeout(connect, 3000) } }
      socket.onerror = () => { if (active) setConnected(false) }
    }
    request('/api/snapshot').then((snapshot) => { if (active) setData(snapshot) }).catch(() => {
      if (active) setError('Backend non disponibile. Avvia FastAPI sulla porta 8000.')
    })
    connect()
    return () => { active = false; if (retryTimer) clearTimeout(retryTimer); socket?.close() }
  }, [])

  const action = useCallback(async (path: string, body?: object) => {
    setBusy(true); setError(null)
    try { setData(await request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) })) }
    catch (err) { setError(err instanceof Error ? err.message : 'Operazione non riuscita') }
    finally { setBusy(false) }
  }, [])

  const dispatch = (incident: Incident, drone: Drone) => {
    const message = `Confermi SOLO la simulazione di ${drone.name} per ${incident.id}?\n\nNessun drone reale verrà attivato.`
    if (window.confirm(message)) void action('/api/dispatch', { incident_id: incident.id, drone_id: drone.id, operator_confirmed: true })
  }
  const reset = () => {
    if (window.confirm('Ripristinare tutti gli scenari e la flotta virtuale?')) void action('/api/reset')
  }

  const drones = data?.drones ?? []
  const incidents = data?.incidents ?? []
  const missions = data?.missions ?? []
  const waiting = incidents.filter((i) => i.status === 'pending').length
  const active = missions.filter((m) => m.status !== 'completed').length
  const averageTravel = useMemo(() => {
    const relevant = missions.filter((m) => m.status !== 'completed')
    return relevant.length ? `${Math.round(relevant.reduce((sum, m) => sum + m.travel_seconds, 0) / relevant.length / 60)}m` : '—'
  }, [missions])
  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#home" className="brand"><span className="brand-mark"><Command size={24} /></span><span><strong>AERES</strong><small>BY GLOBETROTTA</small></span></a>
      <div className="sidebar-section-label">OPERATIONS</div>
      <nav aria-label="Navigazione principale"><a href="#home" className="nav-item active"><Radar size={18} /> Mission control <ChevronRight size={15} /></a>
        <a href="#fleet" className="nav-item"><RadioTower size={18} /> Fleet telemetry</a>
        <a href="#incidents" className="nav-item"><AlertTriangle size={18} /> Incident queue</a>
        <a href="#activity" className="nav-item"><Activity size={18} /> Activity log</a></nav>
      <div className="sidebar-bottom"><ShieldCheck size={19} /><span><strong>Sandbox mode</strong><small>No hardware connections</small></span></div>
    </aside>

    <main id="home" className="content">
      <header className="topbar"><div className="topbar-left"><span className="breadcrumb">AERES <ChevronRight size={13} /> PLATFORM <ChevronRight size={13} /></span>
        <strong>MISSION CONTROL</strong></div><div className="topbar-right"><span className="system-clock"><Clock3 size={15} /> {new Date().toLocaleDateString('it-IT')}</span>
        <span className={`connection ${connected ? 'connected' : 'disconnected'}`}>{connected ? <Wifi size={15} /> : <WifiOff size={15} />}
          {connected ? 'SIM LIVE' : 'OFFLINE'}</span></div></header>
      <div className="page-inner">
        <div className="hero"><div><div className="section-kicker"><span className="live-beacon" /> AUTONOMOUS RESPONSE · SIMULATION</div>
          <h1>Mission <em>Control.</em></h1><p>Emergency response intelligence. Visualizza, coordina e simula missioni aeree in un ambiente sicuro.</p></div>
          <button type="button" onClick={reset} disabled={busy} className="reset-button"><RotateCcw size={16} /> Reset simulation</button></div>
        <div role="note" className="demo-banner"><ShieldCheck size={18} /><span><strong>DEMO / NON OPERATIVO</strong> — Nessun volo reale, nessuna chiamata 112/118, nessuna indicazione clinica. Posizioni, ETA e telemetria sono sintetici.</span></div>
        {error && <div className="error-banner" role="alert"><AlertTriangle size={17} />{error}</div>}
        <section className="stats-grid" aria-label="Metriche simulate">
          <Stat icon={RadioTower} label="TOTAL DRONES" value={drones.length} footnote="Flotta virtuale" />
          <Stat icon={Zap} label="AVAILABLE" value={drones.filter((d) => d.status === 'idle').length} footnote="Disponibili per simulazioni" />
          <Stat icon={AlertTriangle} label="PENDING ALERTS" value={waiting} footnote="Scenari da assegnare" />
          <Stat icon={Clock3} label="SIMULATED ETA" value={averageTravel} footnote={`${active} missioni attive · stimato`} />
        </section>
        <div className="main-grid">
          <MapPanel drones={drones} incidents={incidents} missions={missions} />
          <section className="panel incident-panel" id="incidents"><div className="card-heading"><div><span className="eyebrow">PRIORITY OPERATIONS</span>
            <h2>Incident queue <span className="count-bubble">{waiting}</span></h2></div><AlertTriangle size={19} /></div>
            <div className="incident-list">{incidents.map((incident) => <IncidentRow key={incident.id} incident={incident}
              drone={drones.find((drone) => drone.payload === incident.kind && drone.status === 'idle' && drone.battery >= 30)}
              onDispatch={dispatch} onResolve={(id) => void action(`/api/resolve/${id}`)} busy={busy} />)}</div></section>
        </div>
        <div className="lower-grid">
          <section className="panel" id="fleet"><div className="card-heading"><div><span className="eyebrow">FLEET STATUS</span>
            <h2>Drone telemetry</h2></div><RadioTower size={19} /></div>
            <div className="fleet-list">{drones.map((drone) => <DroneRow drone={drone} key={drone.id} />)}</div></section>
          <section className="panel" id="activity"><div className="card-heading"><div><span className="eyebrow">AUDIT STREAM · DEMO</span>
            <h2>Activity feed</h2></div><Activity size={19} /></div>
            <div className="events-list">{data?.events.slice(0, 6).map((event, i) => <div className="event-row" key={`${event.at}-${i}`}>
              <span className={`event-mark ${event.kind}`} /><span className="event-message">{event.message}</span>
              <time>{new Date(event.at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div></section>
        </div>
        <footer>AERES · AUTONOMOUS EMERGENCY RESPONSE SYSTEM <span>CONCEPT BY GLOBETROTTA · SIMULATION ONLY · v0.1.0</span></footer>
      </div>
    </main>
  </div>
}
