INSERT INTO kinds (id, label, created_at, updated_at) VALUES
  (1, '場所', datetime('now'), datetime('now')),
  (2, '商品', datetime('now'), datetime('now')),
  (3, '体験', datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  updated_at = datetime('now');
