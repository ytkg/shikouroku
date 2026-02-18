CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  kind_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_wishlist INTEGER NOT NULL DEFAULT 0 CHECK (is_wishlist IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kind_id) REFERENCES kinds(id)
);

CREATE INDEX IF NOT EXISTS idx_entities_kind_id ON entities (kind_id);
CREATE INDEX IF NOT EXISTS idx_entities_kind_wishlist ON entities (kind_id, is_wishlist);
