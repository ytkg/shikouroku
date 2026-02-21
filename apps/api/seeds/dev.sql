INSERT INTO kinds (id, label, created_at, updated_at) VALUES
  (1, '場所', datetime('now'), datetime('now')),
  (2, '商品', datetime('now'), datetime('now')),
  (3, '体験', datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  updated_at = datetime('now');

INSERT INTO tags (name, created_at, updated_at) VALUES
  ('コーヒー', datetime('now'), datetime('now')),
  ('落ち着く', datetime('now'), datetime('now')),
  ('アウトドア', datetime('now'), datetime('now')),
  ('ガジェット', datetime('now'), datetime('now')),
  ('リフレッシュ', datetime('now'), datetime('now'))
ON CONFLICT(name) DO UPDATE SET
  updated_at = datetime('now');

INSERT INTO entities (id, kind_id, name, description, is_wishlist, created_at, updated_at) VALUES
  ('seed-kyoto-kissa', 1, '梅小路の喫茶店', 'レトロで静かな雰囲気。', 0, datetime('now'), datetime('now')),
  ('seed-camp-chair', 2, '軽量チェア', '折りたたみしやすい屋外チェア。', 1, datetime('now'), datetime('now')),
  ('seed-morning-sauna', 3, '朝サウナ体験', '90分コース。', 0, datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  kind_id = excluded.kind_id,
  name = excluded.name,
  description = excluded.description,
  is_wishlist = excluded.is_wishlist,
  updated_at = datetime('now');

DELETE FROM entity_relations
WHERE entity_id_low IN ('seed-kyoto-kissa', 'seed-camp-chair', 'seed-morning-sauna')
   OR entity_id_high IN ('seed-kyoto-kissa', 'seed-camp-chair', 'seed-morning-sauna');

INSERT INTO entity_relations (entity_id_low, entity_id_high, created_at) VALUES
  ('seed-camp-chair', 'seed-kyoto-kissa', datetime('now')),
  ('seed-kyoto-kissa', 'seed-morning-sauna', datetime('now'))
ON CONFLICT(entity_id_low, entity_id_high) DO UPDATE SET
  created_at = excluded.created_at;

DELETE FROM entity_tags
WHERE entity_id IN ('seed-kyoto-kissa', 'seed-camp-chair', 'seed-morning-sauna');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-kyoto-kissa', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('コーヒー', '落ち着く');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-camp-chair', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('アウトドア', 'ガジェット');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-morning-sauna', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('リフレッシュ');
