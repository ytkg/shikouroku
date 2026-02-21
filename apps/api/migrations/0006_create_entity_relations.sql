CREATE TABLE IF NOT EXISTS entity_relations (
  entity_id_low TEXT NOT NULL,
  entity_id_high TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_id_low, entity_id_high),
  CHECK (entity_id_low <> entity_id_high),
  FOREIGN KEY (entity_id_low) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id_high) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entity_relations_low ON entity_relations (entity_id_low);
CREATE INDEX IF NOT EXISTS idx_entity_relations_high ON entity_relations (entity_id_high);
