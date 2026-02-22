# 画像添付機能 仕様 v1（壁打ち版）

対象: `apps/web` / `apps/api`

この文書でいう「画像添付機能」は、
**嗜好（entity）に対して複数画像を紐づけ、詳細画面で表示し、編集画面で追加・削除できる機能**を指す。

## 1. 目的

- 嗜好のテキスト情報だけでは伝わりにくい情報を、画像で補完できるようにする。
- 「商品の見た目」「店の外観」「作品のパッケージ」などを1画面で参照できるようにする。

## 2. ユースケース

1. 嗜好詳細で添付画像を一覧表示したい。
2. 嗜好新規登録時に画像も一緒に登録したい。
3. 嗜好編集時に画像を追加・削除したい。
4. ログイン済みユーザーのみ画像へアクセスできるようにしたい。

## 3. V1スコープ

- 対象画面は `嗜好詳細` `嗜好新規登録` `嗜好編集` とする。
- 画像添付件数の上限は設けない（運用上も少量利用を想定）。
- 許可形式は `image/jpeg` `image/png` `image/webp` とする。
- 1ファイル上限は `5MB` とする。
- 画像アップロードは 1 API リクエストにつき 1 ファイルとする（複数同時アップロードはクライアント側で逐次実行）。
- `GET /api/entities/:id/images` は V1 ではページング（`limit`/`cursor`）を持たない。
- 画像本体は R2 に保存し、メタデータは D1 に保存する。
- 画像配信は API 経由（認証必須）で行う。
- 画像の並び替えを V1 に含める（UI操作は上へ/下へボタン）。

## 4. V1非スコープ

- 画像のキャプション/代替テキスト編集。
- サーバー側での画像リサイズ/圧縮。
- GIF/HEIC/SVG 対応。
- 画像検索や AI タグ付け。

## 5. 画面仕様

### 5.1 詳細画面

- 見出し: `画像`
- 表示内容:
  - 正方形サムネイル一覧
  - クリックでダイアログ表示
  - ダイアログ内で `前へ` / `次へ` 遷移
  - ダイアログには画像ファイル名を表示しない
- 0件時は `画像` 項目自体を表示しない。

### 5.2 新規登録画面

- `画像を追加` ボタンでローカルファイルを選択できる。
- 新規作成時は以下順序で保存する。
  - 先に `POST /api/entities` で嗜好を作成
  - 成功後に選択済み画像を `POST /api/entities/:id/images` で順次アップロード
- 一部画像のアップロードに失敗した場合、嗜好本体は作成済みとして扱い、失敗件数を画面で通知する。
- 失敗画像は一覧表示し、`再試行` で同一ファイルの再アップロードを実行できる。

### 5.3 編集画面

- 既存画像を一覧表示する。
- `画像を追加` で新規アップロードできる。
- 各画像ごとに `削除` 操作を提供する。
- 画像の `上へ` / `下へ` 操作による並び替えを提供する。
- アップロード失敗時は新規登録画面と同様に `再試行` を提供する。

## 6. API仕様

### 6.1 画像一覧取得

- `GET /api/entities/:id/images`
- 正常: `200`
- レスポンス例:

```json
{
  "ok": true,
  "images": [
    {
      "id": "img_xxx",
      "entity_id": "ent_xxx",
      "file_name": "ramen.jpg",
      "mime_type": "image/jpeg",
      "file_size": 345678,
      "sort_order": 1,
      "url": "/api/entities/ent_xxx/images/img_xxx/file",
      "created_at": "2026-02-22T00:00:00Z"
    }
  ]
}
```

### 6.2 画像アップロード

- `POST /api/entities/:id/images`
- `Content-Type: multipart/form-data`
- フィールド:
  - `file`: 必須、単一ファイル
- 正常: `201`
- レスポンス例:

```json
{
  "ok": true,
  "image": {
    "id": "img_xxx",
    "entity_id": "ent_xxx",
    "file_name": "ramen.jpg",
    "mime_type": "image/jpeg",
    "file_size": 345678,
    "sort_order": 1,
    "url": "/api/entities/ent_xxx/images/img_xxx/file",
    "created_at": "2026-02-22T00:00:00Z"
  }
}
```

### 6.3 画像削除

- `DELETE /api/entities/:id/images/:imageId`
- 正常: `200` で `{ "ok": true }`

### 6.4 画像ファイル取得

- `GET /api/entities/:id/images/:imageId/file`
- 正常: `200`（バイナリ）
- ヘッダ:
  - `Content-Type`: 登録済み `mime_type`
  - `Cache-Control`: `private, max-age=300`

### 6.5 画像並び替え

- `PATCH /api/entities/:id/images/order`
- body: `{ "orderedImageIds": ["img_1", "img_2", "img_3"] }`
- 正常: `200` で `{ "ok": true }`
- 仕様:
  - `orderedImageIds` は対象 entity の全 image id を重複なく含む必要がある。
  - 受信順に `sort_order` を 1..N で再採番する。

### 6.6 エラー（V1）

- `400`: multipart不正、`file` 欠落、サイズ0など
- `401`: 未認証
- `404`: entity または image が存在しない
- `413`: ファイルサイズ上限超過
- `415`: 非対応MIMEタイプ
- `500`: 保存失敗（D1/R2）

## 7. データモデル（V1）

新規テーブル `entity_images` を追加する。

```sql
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

CREATE INDEX IF NOT EXISTS idx_entity_images_entity_id ON entity_images(entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_images_entity_sort_order ON entity_images(entity_id, sort_order);
```

## 8. ストレージ仕様（R2）

- バケット名（binding）: `ENTITY_IMAGES`
- オブジェクトキー: `entities/{entityId}/{imageId}.{ext}`
- ext は MIME に応じて決定（jpeg/png/webp）
- 公開 URL は使わず、常に API 経由で配信する。

## 9. 業務ルール

- 画像添付件数の上限は設けない。
- `sort_order` は 1 始まりの連番。
- 削除時は欠番を詰める（例: 1,2,4 -> 1,2,3）。
- 並び替え時は渡された `orderedImageIds` で `sort_order` を再採番する。
- `entity` 削除時、`entity_images` は CASCADE で削除される。
- R2 オブジェクト削除は API 側で明示実行する。

## 10. 実装方針（フロント）

- `entities/entity/api` に `images.client.ts` / `images.response.ts` を追加する。
- `entities/entity/model` に画像用 query/mutation を追加する。
- `features/entities/detail` に画像セクションを追加する。
- `features/entities/create` は作成後アップロードフローを追加する。
- `features/entities/edit` は追加/削除/並び替えUIを追加する。
- 新規/編集の双方で、失敗画像の `再試行` UI を提供する。
- エラー表示は既存 `toErrorMessage` / `resolveQueryError` を再利用する。

## 11. 実装方針（バックエンド）

- `wrangler.toml` と `app-env.ts` に `ENTITY_IMAGES: R2Bucket` バインディングを追加する。
- 画像API用の repository / usecase を追加する。
- `index.ts` に画像 API ルート（list/upload/delete/file/order）を追加する。
- multipart パースは画像 API のみで許可し、既存 JSON API 仕様は維持する。

## 12. テスト方針

- APIレスポンスパーサ:
  - `images.response.ts` の正常系/異常系テストを追加。
- APIクライアント:
  - 画像一覧/アップロード/削除/取得/並び替え API のテストを追加。
- バックエンド:
  - サイズ超過、MIME不正、並び替え不正、存在しない entity/image のテストを追加。
- フロント:
  - 作成後アップロード成功/部分失敗/再試行成功を検証。
  - 編集画面の追加/削除/並び替え（上へ/下へ）/再試行反映を検証。
  - 詳細画面の画像ダイアログ遷移（前へ/次へ）と 0件時非表示を検証。

## 13. 受け入れ条件

1. 新規作成時に画像を選択して保存すると、詳細画面で画像が表示される。
2. 編集画面で画像を削除すると、詳細画面から即時に消える。
3. 新規/編集の両画面で、失敗した画像アップロードを `再試行` できる。
4. 編集画面で並び替えを保存すると、詳細画面の表示順にも反映される。
5. 詳細画面の画像サムネイルは正方形表示で、クリック時はダイアログで表示される。
6. 詳細画面の画像ダイアログで `前へ` / `次へ` 遷移できる。
7. 詳細画面で画像0件のとき `画像` 項目は表示されない。
8. 非対応形式（例: `image/gif`）は `415` で拒否される。
9. 未認証状態で画像 API にアクセスすると `401` になる。

## 14. 壁打ちしたい論点（要決定）

- 現時点で未決論点なし。

## 15. 実装状況（2026-02-22）

- 完了: `entity_images` テーブルを migration に追加。
- 完了: 画像API（list/upload/delete/file/order）を追加。
- 完了: 新規登録画面で登録時アップロードと失敗分再試行を実装。
- 完了: 編集画面で追加/削除/並び替え（上へ/下へ）と失敗分再試行を実装。
- 完了: 詳細画面で正方形サムネイル表示とダイアログプレビュー（前へ/次へ）を実装。
- 完了: 画像API向けの parser/client テストを追加。
