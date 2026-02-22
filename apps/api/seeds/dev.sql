INSERT INTO kinds (id, label, created_at, updated_at) VALUES
  (1, '場所', datetime('now'), datetime('now')),
  (2, '商品', datetime('now'), datetime('now')),
  (3, '体験', datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  updated_at = datetime('now');

DELETE FROM entity_tags;
DELETE FROM entity_relations;
DELETE FROM entities;
DELETE FROM tags;

INSERT INTO tags (name, created_at, updated_at) VALUES
  ('コーヒー', datetime('now'), datetime('now')),
  ('落ち着く', datetime('now'), datetime('now')),
  ('アウトドア', datetime('now'), datetime('now')),
  ('ガジェット', datetime('now'), datetime('now')),
  ('リフレッシュ', datetime('now'), datetime('now')),
  ('読書', datetime('now'), datetime('now')),
  ('ラーメン', datetime('now'), datetime('now')),
  ('夜景', datetime('now'), datetime('now')),
  ('クラフト', datetime('now'), datetime('now')),
  ('週末', datetime('now'), datetime('now')),
  ('運動', datetime('now'), datetime('now'))
ON CONFLICT(name) DO UPDATE SET
  updated_at = datetime('now');

INSERT INTO entities (id, kind_id, name, description, is_wishlist, created_at, updated_at) VALUES
  ('seed-kyoto-kissa', 1, '梅小路の喫茶店', 'レトロで静かな雰囲気。', 0, datetime('now'), datetime('now')),
  ('seed-camp-chair', 2, '軽量チェア', '折りたたみしやすい屋外チェア。', 1, datetime('now'), datetime('now')),
  ('seed-morning-sauna', 3, '朝サウナ体験', '90分コース。', 0, datetime('now'), datetime('now')),
  ('seed-nakano-book-cafe', 1, '中野のブックカフェ', '静かに読書できる席が多い。', 0, datetime('now'), datetime('now')),
  ('seed-tonkotsu-ramen', 2, '濃厚豚骨ラーメン', '香り強めで替玉前提。', 0, datetime('now'), datetime('now')),
  ('seed-evening-river-run', 3, '夕方の川沿いラン', '30分の軽めランニング。', 1, datetime('now'), datetime('now')),
  ('seed-kobe-aquarium', 1, '神戸の水族館', '夜の照明展示がきれい。', 0, datetime('now'), datetime('now')),
  ('seed-hand-drip-set', 2, 'ハンドドリップセット', '軽量ミルとドリッパーのセット。', 0, datetime('now'), datetime('now')),
  ('seed-pottery-workshop', 3, '陶芸ワークショップ', '手びねりで器を作る。', 0, datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  kind_id = excluded.kind_id,
  name = excluded.name,
  description = excluded.description,
  is_wishlist = excluded.is_wishlist,
  updated_at = datetime('now');

WITH
place_names(sort_order, name, is_wishlist) AS (
  VALUES
    (1, '神保町の古本喫茶', 0),
    (2, '下北沢の深夜カフェ', 0),
    (3, '中目黒の川沿いベーカリー', 0),
    (4, '蔵前の文具店', 0),
    (5, '吉祥寺の小劇場', 0),
    (6, '三軒茶屋の立ち飲み', 1),
    (7, '鎌倉の海辺書店', 0),
    (8, '札幌の味噌ラーメン通り', 0),
    (9, '福岡の屋台街', 1),
    (10, '名古屋の喫茶モーニング店', 0),
    (11, '金沢の工芸ギャラリー', 0),
    (12, '京都の路地甘味処', 0),
    (13, '神戸のジャズバー', 0),
    (14, '仙台の牛たん定食屋', 0),
    (15, '広島のお好み焼き店', 0),
    (16, '高松のうどん食堂', 0),
    (17, '那覇の市場食堂', 0),
    (18, '横浜の夜景スポット', 1),
    (19, '恵比寿のワインバル', 0),
    (20, '赤坂の老舗蕎麦屋', 0),
    (21, '池袋のシネマコンプレックス', 0),
    (22, '渋谷のレコードショップ', 0),
    (23, '秋葉原の電子部品店', 0),
    (24, '日本橋の海鮮居酒屋', 0),
    (25, '谷中の古民家カフェ', 0),
    (26, '浅草の寄席', 0),
    (27, '代官山のセレクト書店', 0),
    (28, '表参道のフラワーショップ', 0),
    (29, '二子玉川の河川敷', 1),
    (30, '大阪中崎町の雑貨通り', 0)
),
product_names(sort_order, name, is_wishlist) AS (
  VALUES
    (1, '折りたたみ電気ケトル', 0),
    (2, 'ノイズキャンセルイヤホン', 1),
    (3, '軽量トレッキングシューズ', 0),
    (4, '万年筆スターターセット', 0),
    (5, 'ハンドドリップケトル', 0),
    (6, 'ミニプロジェクター', 0),
    (7, '低反発トラベル枕', 0),
    (8, '炭酸対応ボトル', 0),
    (9, 'スマートLEDランタン', 0),
    (10, '防水Bluetoothスピーカー', 0),
    (11, '充電式コーヒーミル', 0),
    (12, 'キャンプ用ホットサンドメーカー', 0),
    (13, 'ポータブル電源500Wh', 1),
    (14, 'USB-Cハブ7in1', 0),
    (15, '電子書籍リーダー', 0),
    (16, 'アナログレコードクリーナー', 0),
    (17, '自転車用フロントライト', 0),
    (18, 'メカニカルキーボード', 0),
    (19, '静音ワイヤレスマウス', 0),
    (20, 'マグネット式スマホスタンド', 0),
    (21, '低温調理器', 0),
    (22, 'コンパクト加湿器', 0),
    (23, 'アロマディフューザー', 0),
    (24, '速乾スポーツタオル', 0),
    (25, 'パッカブルレインジャケット', 0),
    (26, '真空断熱フードジャー', 0),
    (27, '卓上IHヒーター', 0),
    (28, '手挽き胡椒ミル', 0),
    (29, '折りたたみヨガマット', 1),
    (30, '自立式ハンモックチェア', 0)
),
experience_names(sort_order, name, is_wishlist) AS (
  VALUES
    (1, '早朝の皇居ラン', 0),
    (2, '仕事終わりの銭湯巡り', 0),
    (3, '週末の焚き火ナイト', 0),
    (4, '雨の日の美術館散歩', 0),
    (5, '朝いち市場めぐり', 0),
    (6, '夜の展望台フォトウォーク', 1),
    (7, '初めての陶芸体験', 0),
    (8, '地元パン屋の食べ比べ', 0),
    (9, '里山ハイキング', 0),
    (10, '川沿いサイクリング', 0),
    (11, '朗読イベント参加', 0),
    (12, 'ボードゲーム会', 0),
    (13, '手作り味噌ワークショップ', 0),
    (14, '星空観察会', 0),
    (15, '野外映画上映会', 0),
    (16, '写真現像ワークショップ', 0),
    (17, '朝活読書会', 0),
    (18, 'ワインテイスティング会', 0),
    (19, 'スパイスカレー作り教室', 0),
    (20, '銭湯サウナ3軒はしご', 1),
    (21, '古着屋巡り', 0),
    (22, 'うつわ市めぐり', 0),
    (23, '路地裏食べ歩き', 0),
    (24, '港町クルーズ', 0),
    (25, '早朝座禅会', 0),
    (26, '漁港の朝市体験', 0),
    (27, 'バードウォッチング', 0),
    (28, 'ヨガリトリート半日', 0),
    (29, 'クラフトビール飲み比べ', 0),
    (30, 'ボルダリング体験', 0),
    (31, 'うどん打ち体験', 0)
),
generated_entities(id, kind_id, name, description, is_wishlist) AS (
  SELECT
    printf('seed-sample-%03d', sort_order),
    1,
    name,
    printf('%sをゆっくり楽しむ。', name),
    is_wishlist
  FROM place_names
  UNION ALL
  SELECT
    printf('seed-sample-%03d', sort_order + 30),
    2,
    name,
    printf('%sを日常で使う。', name),
    is_wishlist
  FROM product_names
  UNION ALL
  SELECT
    printf('seed-sample-%03d', sort_order + 60),
    3,
    name,
    printf('%sに参加してみる。', name),
    is_wishlist
  FROM experience_names
)
INSERT INTO entities (id, kind_id, name, description, is_wishlist, created_at, updated_at)
SELECT
  id,
  kind_id,
  name,
  description,
  is_wishlist,
  datetime('now'),
  datetime('now')
FROM generated_entities
WHERE true
ON CONFLICT(id) DO UPDATE SET
  kind_id = excluded.kind_id,
  name = excluded.name,
  description = excluded.description,
  is_wishlist = excluded.is_wishlist,
  updated_at = datetime('now');

INSERT INTO entity_relations (entity_id_low, entity_id_high, created_at) VALUES
  ('seed-camp-chair', 'seed-kyoto-kissa', datetime('now')),
  ('seed-camp-chair', 'seed-evening-river-run', datetime('now')),
  ('seed-evening-river-run', 'seed-kobe-aquarium', datetime('now')),
  ('seed-evening-river-run', 'seed-morning-sauna', datetime('now')),
  ('seed-hand-drip-set', 'seed-kyoto-kissa', datetime('now')),
  ('seed-hand-drip-set', 'seed-nakano-book-cafe', datetime('now')),
  ('seed-hand-drip-set', 'seed-pottery-workshop', datetime('now')),
  ('seed-kobe-aquarium', 'seed-pottery-workshop', datetime('now')),
  ('seed-kyoto-kissa', 'seed-morning-sauna', datetime('now')),
  ('seed-kyoto-kissa', 'seed-tonkotsu-ramen', datetime('now')),
  ('seed-nakano-book-cafe', 'seed-tonkotsu-ramen', datetime('now'))
ON CONFLICT(entity_id_low, entity_id_high) DO UPDATE SET
  created_at = excluded.created_at;

WITH RECURSIVE seq(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 90
)
INSERT INTO entity_relations (entity_id_low, entity_id_high, created_at)
SELECT
  printf('seed-sample-%03d', n),
  printf('seed-sample-%03d', n + 1),
  datetime('now')
FROM seq
WHERE true
ON CONFLICT(entity_id_low, entity_id_high) DO UPDATE SET
  created_at = excluded.created_at;

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-kyoto-kissa', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('コーヒー', '落ち着く', '読書');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-camp-chair', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('アウトドア', 'ガジェット', '週末');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-morning-sauna', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('リフレッシュ', '運動');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-nakano-book-cafe', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('コーヒー', '読書', '落ち着く');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-tonkotsu-ramen', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('ラーメン');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-evening-river-run', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('運動', '夜景', '週末');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-kobe-aquarium', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('夜景', 'リフレッシュ');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-hand-drip-set', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('コーヒー', 'ガジェット', 'クラフト');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT 'seed-pottery-workshop', id, datetime('now'), datetime('now')
FROM tags
WHERE name IN ('クラフト', 'リフレッシュ', '週末');

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT
  e.id,
  t.id,
  datetime('now'),
  datetime('now')
FROM entities e
INNER JOIN tags t
  ON t.name = CASE e.kind_id
    WHEN 1 THEN '読書'
    WHEN 2 THEN 'ガジェット'
    ELSE 'リフレッシュ'
  END
WHERE e.id LIKE 'seed-sample-%';

INSERT INTO entity_tags (entity_id, tag_id, created_at, updated_at)
SELECT
  e.id,
  t.id,
  datetime('now'),
  datetime('now')
FROM entities e
INNER JOIN tags t
  ON t.name = CASE substr(e.id, -1, 1)
    WHEN '0' THEN '週末'
    WHEN '1' THEN '週末'
    WHEN '2' THEN '週末'
    WHEN '3' THEN '夜景'
    WHEN '4' THEN '夜景'
    WHEN '5' THEN '夜景'
    ELSE 'アウトドア'
  END
WHERE e.id LIKE 'seed-sample-%';
