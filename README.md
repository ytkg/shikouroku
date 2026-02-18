# shikouroku

Cloudflare Workers 1つで `API + React SPA` を同一ドメイン配信する最小構成です。

- Frontend: React + TypeScript + Vite (`apps/web`)
- Backend: Cloudflare Workers + TypeScript + Hono (`apps/api`)
- Static files: `apps/api/wrangler.toml` の `[assets] directory = "../web/dist"`
- Auth: `https://auth.takagi.dev` を利用（JWTをHttpOnly Cookieで保持）
- UI: Tailwind CSS + shadcn/ui（button/card/input/label/form）
- DB: Cloudflare D1（`apps/api/wrangler.toml` の `DB` バインディング）

## 前提

- Node.js 20+
- npm
- Cloudflare アカウント

## セットアップ

```bash
npm install
```

## Tailwind + shadcn/ui 導入コマンド（実施済み）

```bash
npm --workspace @shikouroku/web install -D tailwindcss postcss autoprefixer @types/node
npm --workspace @shikouroku/web install class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot @radix-ui/react-label react-hook-form
```

追加した主なファイル:

- `apps/web/tailwind.config.ts`
- `apps/web/postcss.config.js`
- `apps/web/components.json`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/components/ui/*`

## ローカル開発

### 推奨（並列起動）

```bash
npm run dev
```

- Web: `http://localhost:5173` (Vite)
- API: `http://127.0.0.1:8787` (Wrangler)
- Web側は `/api` を Wrangler に proxy するため、`fetch("/api/hello")` がそのまま動きます。
- API は `wrangler dev --remote` で起動し、`preview_database_id`（開発DB）を参照します。
- 事前に `npm run d1:migrate:dev` を実行してください（`--preview` で開発DBへ適用）。

### 本番相当（Workerで静的配信まで確認）

```bash
npm run build
npm --workspace @shikouroku/api run dev
```

- `http://127.0.0.1:8787` で SPA と API を同一オリジンで確認できます。

## 認証フロー

- 未ログインで `/` にアクセスすると Worker が `/login` へ `302` リダイレクト
- ログイン成功で `/` へ遷移
- ログイン済みで `/login` にアクセスすると `/` へ `302` リダイレクト
- API は `/api/login` 以外を認証必須にし、未認証は `401`

ログインは `auth.takagi.dev` の `POST /login` を使い、取得したJWTを `shikouroku_token` Cookie に保存します。  
リクエスト時は `GET /verify` でトークン検証します。

## ビルド

```bash
npm run build
```

- `apps/web/dist` を生成
- API の型チェック実行

## D1 セットアップ

1. D1 DB を作成（production / development）

```bash
npx wrangler d1 create shikouroku-prod
npx wrangler d1 create shikouroku-dev
```

2. `apps/api/wrangler.toml` を次の方針で設定

```toml
[[d1_databases]]
binding = "DB"
database_name = "shikouroku-prod"
database_id = "PROD_DATABASE_ID"
preview_database_id = "DEV_DATABASE_ID"
```

3. マイグレーション適用（開発DB = `preview_database_id`）

```bash
npm run d1:migrate:dev
```

4. マイグレーション適用（本番DB = `database_id`）

```bash
npm run d1:migrate:prod
```

5. 疎通確認（認証後）

```bash
curl http://127.0.0.1:8787/api/db/health
```

## kinds 初期データメモ

```sql
INSERT INTO kinds (id, label, created_at, updated_at) VALUES
  (1, '場所', datetime('now'), datetime('now')),
  (2, '商品', datetime('now'), datetime('now')),
  (3, '体験', datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  updated_at = datetime('now');
```

## デプロイ（Workers一本）

初回のみ Cloudflare ログイン:

```bash
npx wrangler login
```

デプロイ:

```bash
npm run deploy
```

これで 1 つの Workers サービス `shikouroku` に以下がまとまってデプロイされます。

- `/api/*`: Hono API
- `/` とその他パス: `apps/web/dist` の静的ファイル（SPA fallback あり）

## 動作確認

1. `npm run dev` を実行
2. `http://localhost:5173` を開く
3. Card UI と Input/Button が表示される
4. `APIの応答` に `/api/hello` の JSON が表示される
5. `npm run build` が成功する
