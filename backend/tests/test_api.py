from fastapi.testclient import TestClient
from app.main import app, simulator


def setup_function():
    simulator.reset()


def test_snapshot_is_simulation_only():
    with TestClient(app) as client:
        response = client.get('/api/snapshot')
    assert response.status_code == 200
    assert response.json()['mode'] == 'SIMULATION_ONLY'
    assert len(response.json()['drones']) == 3


def test_dispatch_requires_operator_confirmation():
    with TestClient(app) as client:
        response = client.post('/api/dispatch', json={
            'incident_id': 'EVT-104', 'drone_id': 'AER-01', 'operator_confirmed': False
        })
    assert response.status_code == 400


def test_rejects_payload_mismatch():
    with TestClient(app) as client:
        response = client.post('/api/dispatch', json={
            'incident_id': 'EVT-104', 'drone_id': 'AER-02', 'operator_confirmed': True
        })
    assert response.status_code == 409


def test_dispatch_arrival_and_virtual_return():
    with TestClient(app) as client:
        response = client.post('/api/dispatch', json={
            'incident_id': 'EVT-105', 'drone_id': 'AER-02', 'operator_confirmed': True
        })
        assert response.status_code == 200
        assert response.json()['incidents'][1]['status'] == 'assigned'
        for _ in range(200):
            simulator.tick()
        assert client.get('/api/snapshot').json()['incidents'][1]['status'] == 'on_scene'
        resolved = client.post('/api/resolve/EVT-105')
        assert resolved.status_code == 200
        for _ in range(200):
            simulator.tick()
        drone = next(d for d in client.get('/api/snapshot').json()['drones'] if d['id'] == 'AER-02')
        assert drone['status'] == 'idle'


def test_duplicate_assignment_rejected():
    with TestClient(app) as client:
        payload = {'incident_id': 'EVT-104', 'drone_id': 'AER-01', 'operator_confirmed': True}
        assert client.post('/api/dispatch', json=payload).status_code == 200
        assert client.post('/api/dispatch', json=payload).status_code == 409
