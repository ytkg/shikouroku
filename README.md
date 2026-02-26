# shikouroku

Cloudflare Workers 1つで `API + React SPA` を同一ドメイン配信する構成です。  
最終更新: 2026-02-23

## 技術スタック

- Frontend: React 18 + TypeScript + Vite + SWR + Tailwind CSS + shadcn/ui (`apps/web`)
- Backend: Cloudflare Workers + Hono + TypeScript (`apps/api`)
- Data: Cloudflare D1 (`DB`) / Cloudflare R2 (`ENTITY_IMAGES`)
- Auth: 外部認証API（`AUTH_BASE_URL`、既定値 `https://auth.takagi.dev`）

## 主な機能

- ログイン/ログアウト（access token + refresh token を HttpOnly Cookie 管理）
- 嗜好データ（entity）の一覧・詳細・作成・更新
- タグ管理、関連嗜好（entity relation）管理
- 画像添付（一覧/追加/並び替え/削除/配信）
- R2 削除失敗時の補償キュー（`image_cleanup_tasks`）と定期クリーンアップ（cron）

画像アップロード制約:

- MIME type: `image/jpeg`, `image/png`, `image/webp`
- 最大サイズ: 5MB

## リポジトリ構成

- `apps/web`: React SPA
- `apps/api`: Workers API + 静的配信 + cron
- `docs`: 仕様・構成ガイド（`docs/README.md` を入口に利用）

## 前提

- Node.js 20 以上
- npm
- Cloudflare アカウント

## 初期セットアップ

1. 依存をインストール

```bash
npm install
```

2. D1 と R2 を作成（未作成の場合）

```bash
npx wrangler d1 create shikouroku-prod
npx wrangler d1 create shikouroku-dev
npx wrangler r2 bucket create shikouroku-entity-images-prod
npx wrangler r2 bucket create shikouroku-entity-images-dev
```

3. `apps/api/wrangler.toml` の `d1_databases` / `r2_buckets` / `vars` を環境に合わせて設定

4. 開発DBにマイグレーション・シードを適用

```bash
npm run d1:migrate:dev
npm run d1:seed:dev
```

## ローカル開発

推奨（Web + API 並列起動）:

```bash
npm run dev
```

- Web: `http://localhost:5173`（Vite）
- API: `http://127.0.0.1:8787`（Wrangler）
- Web は `/api` を `127.0.0.1:8787` にプロキシします。
- API は `wrangler dev --remote` で起動し、`preview_database_id` / `preview_bucket_name` を参照します。

本番相当（Worker 経由で SPA 配信も含めて確認）:

```bash
npm run build
npm --workspace @shikouroku/api run dev
```

## 主要コマンド（ルート）

```bash
npm run dev
npm run build
npm run deploy
npm run lint
npm run test
npm run test:api
npm run test:integration:api
npm run typecheck
npm run quality:web
npm run quality:api
```

DB運用コマンド:

```bash
npm run d1:migrate:dev
npm run d1:migrate:prod
npm run d1:seed:dev
npm run d1:seed:prod
npm run d1:tables:dev
npm run d1:tables:prod
```

補足:

- `npm run test`: Web 側 Vitest 一式
- `npm run test:api`: API 側 Vitest 一式
- `npm run quality:web`: `lint + test:unit + test:architecture + typecheck`
- `npm run quality:api`: API の `check + test`

## API の共通仕様

- 正常系: `{ ok: true, ...payload, requestId }`
- 異常系: `{ ok: false, error: { code, message }, requestId }`
- `/api/login` 以外の `/api/*` は認証必須

## 主要エンドポイント

- 認証
  - `POST /api/login`
  - `POST /api/logout`
- マスタ
  - `GET /api/kinds`
  - `GET /api/tags`
  - `POST /api/tags`
  - `DELETE /api/tags/:id`
- entity
  - `GET /api/entities`
  - `GET /api/entities/:id`
  - `POST /api/entities`
  - `PATCH /api/entities/:id`
- 関連嗜好
  - `GET /api/entities/:id/related`
  - `POST /api/entities/:id/related`
  - `DELETE /api/entities/:id/related/:relatedEntityId`
- 画像
  - `GET /api/entities/:id/images`
  - `POST /api/entities/:id/images`（multipart/form-data）
  - `PATCH /api/entities/:id/images/order`
  - `DELETE /api/entities/:id/images/:imageId`
  - `GET /api/entities/:id/images/:imageId/file`
- メンテナンス
  - `GET /api/maintenance/image-cleanup/tasks?limit=20`
  - `POST /api/maintenance/image-cleanup/run?limit=20`

## API 利用例（curl）

`shikouroku_token` / `shikouroku_refresh_token` は `Secure` Cookie のため、以下は HTTPS 環境を前提にしています。

```bash
export BASE_URL="https://<your-worker-domain>"
export COOKIE_JAR="./.tmp/shikouroku.cookies"
mkdir -p .tmp
```

1. ログイン（Cookie保存）

```bash
curl -sS -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/login" \
  -H "content-type: application/json" \
  --data '{"username":"<username>","password":"<password>"}'
```

2. 一覧取得（認証付き）

```bash
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/kinds"
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/tags"
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/entities?limit=20"
```

3. タグ作成

```bash
curl -sS -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/tags" \
  -H "content-type: application/json" \
  --data '{"name":"Coffee"}'
```

4. entity 作成（`kindId` は既存ID）

```bash
curl -sS -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/entities" \
  -H "content-type: application/json" \
  --data '{
    "kindId": 1,
    "name": "Sample",
    "description": "sample entity",
    "isWishlist": false,
    "tagIds": [1]
  }'
```

5. 画像アップロード（multipart/form-data）

```bash
curl -sS -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/entities/<entityId>/images" \
  -F "file=@./sample.png;type=image/png"
```

6. cleanup タスク確認 / 実行

```bash
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/maintenance/image-cleanup/tasks?limit=20"
curl -sS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/maintenance/image-cleanup/run?limit=20"
```

7. ログアウト

```bash
curl -sS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/logout"
```

## データモデル（概要）

- `kinds`
- `entities`（`(kind_id, name)` ユニーク）
- `tags`
- `entity_tags`（`(entity_id, tag_id)` 複合主キー）
- `entity_relations`（`(entity_id_low, entity_id_high)` 複合主キー）
- `entity_images`（`(entity_id, sort_order)` ユニーク）
- `image_cleanup_tasks`（R2 補償処理キュー）

詳細なDDLは `apps/api/migrations` を参照してください。

## デプロイ

初回のみ:

```bash
npx wrangler login
```

デプロイ:

```bash
npm run deploy
```

`shikouroku` Worker に以下がデプロイされます。

- `/api/*`: Hono API
- `/` および他パス: `apps/web/dist` の静的配信（SPA fallback）
- cron: `*/30 * * * *` で画像クリーンアップ実行

## 運用チェックリスト

### リリース前

1. `npm run quality:web`
2. `npm run quality:api`
3. （マイグレーション追加時）`npm run d1:migrate:prod`
4. `npm run build`

### リリース実行

1. `npm run deploy`
2. 必要に応じて `npm run d1:seed:prod`

### リリース後確認

1. `/login` -> `/` の遷移と認証状態を確認
2. `GET /api/entities` が `ok: true` で応答することを確認
3. 画像の追加/削除が成功することを確認
4. `GET /api/maintenance/image-cleanup/tasks?limit=20` の残タスク件数を確認

### 定期運用（週次目安）

1. cleanup 残タスクが増えていないか確認
2. 必要時に `POST /api/maintenance/image-cleanup/run?limit=20` を実行
3. 障害調査時は `npx wrangler tail` で Worker ログを確認

## CI

- `.github/workflows/web-quality.yml`: `npm run quality:web`
- `.github/workflows/api-quality.yml`: `npm run quality:api`

## 関連ドキュメント

- `docs/README.md`（ドキュメント入口）
- `docs/backend-architecture-review.md`
- `docs/archive/frontend-architecture-review.md`
- `docs/image-attachment-feature-spec.md`
- `docs/preference-feature-spec.md`
