# shikouroku

Cloudflare Workers 1つで `API + React SPA` を同一ドメイン配信する最小構成です。

- Frontend: React + TypeScript + Vite (`apps/web`)
- Backend: Cloudflare Workers + TypeScript + Hono (`apps/api`)
- Static files: `apps/api/wrangler.toml` の `[assets] directory = "../web/dist"`

## 前提

- Node.js 20+
- npm
- Cloudflare アカウント

## セットアップ

```bash
npm install
```

## ローカル開発

### 推奨（並列起動）

```bash
npm run dev
```

- Web: `http://localhost:5173` (Vite)
- API: `http://127.0.0.1:8787` (Wrangler)
- Web側は `/api` を Wrangler に proxy するため、`fetch("/api/hello")` がそのまま動きます。

### 本番相当（Workerで静的配信まで確認）

```bash
npm run build
npm --workspace @shikouroku/api run dev
```

- `http://127.0.0.1:8787` で SPA と API を同一オリジンで確認できます。

## ビルド

```bash
npm run build
```

- `apps/web/dist` を生成
- API の型チェック実行

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

1. ブラウザでトップページを開く
2. 画面に `APIの応答` が表示される
3. `GET /api/hello` が次を返す

```json
{
  "ok": true,
  "message": "hello shikouroku"
}
```
