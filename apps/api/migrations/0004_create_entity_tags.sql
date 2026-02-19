CREATE TABLE IF NOT EXISTS entity_tags (
  entity_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_id, tag_id),
  FOREIGN KEY (entity_id) REFERENCES entities(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
