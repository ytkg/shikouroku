CREATE TABLE IF NOT EXISTS entity_locations (
  entity_id TEXT PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entity_locations_entity_id ON entity_locations (entity_id);
