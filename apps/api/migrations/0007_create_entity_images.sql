CREATE TABLE IF NOT EXISTS entity_images (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entity_images_entity_id ON entity_images (entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_images_entity_sort_order ON entity_images (entity_id, sort_order);
