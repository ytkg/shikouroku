# 画像添付機能 仕様 v1（実装済み / 2026-02-23）

対象: `apps/web` / `apps/api`

## 1. 機能概要

- entity ごとに複数画像を保持する。
- 画像実体は R2、メタデータは D1 に保存する。

## 2. 画面仕様

### 2.1 詳細画面

- 画像が1件以上ある場合のみ `画像` セクションを表示。
- サムネイルは正方形表示。
- クリックでモーダル表示し、`前へ/次へ` とキーボード（←/→/Esc）に対応。

### 2.2 新規登録画面

- 複数ファイルを選択可能。
- entity 作成後に画像を順次アップロード。
- 失敗画像は保持し、`失敗分を再試行` で再アップロード可能。

### 2.3 編集画面

- 画像追加、削除、並び替え（上へ/下へ）を提供。
- 並び替えは `orderedImageIds` を送って保存。
- 失敗画像は新規登録画面と同様に再試行可能。

## 3. API 仕様

- `GET /api/entities/:id/images`
  - `200`: `{ ok: true, images: EntityImage[] }`
- `POST /api/entities/:id/images`
  - multipart/form-data (`file`)
  - `201`: `{ ok: true, image: EntityImage }`
- `PATCH /api/entities/:id/images/order`
  - body: `{ orderedImageIds: string[] }`
  - `200`: `{ ok: true }`
- `DELETE /api/entities/:id/images/:imageId`
  - `200`: `{ ok: true }`
- `GET /api/entities/:id/images/:imageId/file`
  - `200`: 画像バイナリ
  - header: `Cache-Control: private, max-age=300`

### 3.1 エラー

- `400`: multipart不正、`file` 欠落、`orderedImageIds` 不正
- `401`: 未認証
- `404`: entity/image/file 不在
- `413`: サイズ上限超過（5MB）
- `415`: MIME 非対応（jpeg/png/webp のみ）
- `500`: R2/D1 更新失敗、cleanup task 操作失敗

## 4. データモデル

`entity_images`

- 主キー: `id`
- 一意: `object_key`, `(entity_id, sort_order)`
- 並び: `sort_order ASC, created_at ASC`

`image_cleanup_tasks`

- R2 削除補償用キュー
- 失敗時の reason / retry_count / last_error を保持

## 5. 整合性ルール

1. アップロード時は `R2 put -> D1 insert`。
2. metadata 保存失敗時は R2 delete を試行し、失敗時は cleanup task enqueue。
3. 削除時は metadata 削除と sort_order 詰めを D1 unit-of-work で実行。
4. R2 delete 失敗時は cleanup task enqueue（enqueue 不能時は 500）。
5. cleanup task は手動APIと cron で再実行する。

## 6. テスト観点（現行）

- parser/client の正常・異常系
- upload/delete/reorder のユースケーステスト
- maintenance cleanup の integration test

## 7. 既知の制約

- 画像件数の上限は未設定。
- サーバー側リサイズやサムネイル生成は未対応。
- GIF/HEIC/SVG は非対応。
