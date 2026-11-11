-- Draft future PostgreSQL/PostGIS schema; NOT migrated, deployed or used by the MVP.
-- No patient/personal information is required by these records.
-- Requires PostgreSQL with postgis extension installed and enabled.
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS drone_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  payload_kind TEXT NOT NULL CHECK (payload_kind IN ('AED','LED','MEDICAL')),
  status TEXT NOT NULL CHECK (status IN ('idle','en_route','on_scene','returning','unavailable')),
  battery_percent SMALLINT CHECK (battery_percent BETWEEN 0 AND 100),
  position geography(POINT, 4326),
  base_position geography(POINT, 4326),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_scenarios (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('AED','LED','MEDICAL')),
  priority TEXT NOT NULL CHECK (priority IN ('critical','high','medium')),
  status TEXT NOT NULL CHECK (status IN ('pending','assigned','on_scene','resolved')),
  location geography(POINT, 4326),
  is_simulation BOOLEAN NOT NULL DEFAULT TRUE CHECK (is_simulation),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS virtual_missions (
  id TEXT PRIMARY KEY,
  drone_id TEXT NOT NULL REFERENCES drone_assets(id),
  incident_id TEXT NOT NULL REFERENCES incident_scenarios(id),
  operator_id UUID REFERENCES operators(id),
  approved_at timestamptz,
  status TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id UUID REFERENCES operators(id),
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_incident_scenarios_location ON incident_scenarios USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_drone_assets_position ON drone_assets USING GIST(position);
CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events(occurred_at DESC);
