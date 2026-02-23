# バックエンド構成ガイド（2026-02-23）

対象: `apps/api/src`

## 1. 目的

- 現行の責務分割と依存境界を共有する。
- API 契約と運用ルールを、実装に追従した状態で保つ。

## 2. ディレクトリ構成（現行）

- `app/`
  - `create-app.ts`: ミドルウェア登録、`/api` ルーティング、SPA fallback 配線
  - `scheduled.ts`: cron からの定期処理（画像クリーンアップ）
- `routes/api/`
  - HTTP 入出力と application 呼び出しに限定
- `modules/`
  - `auth`, `catalog`, `maintenance` の業務ロジック
  - 各モジュールは `application` / `ports` / `infra` で分離
- `shared/`
  - HTTP 共通処理、バリデーション、D1 ユーティリティ

`index.ts` はエントリポイントに限定し、責務集中を避ける構成です。

## 3. API 契約

### 3.1 共通レスポンス

- 正常系: `{ ok: true, ...payload, requestId }`
- 異常系: `{ ok: false, error: { code, message }, requestId }`

### 3.2 主要エンドポイント

- 認証
  - `POST /api/login`
  - `POST /api/logout`
- マスタ
  - `GET /api/kinds`
  - `GET /api/tags`
  - `POST /api/tags`
  - `DELETE /api/tags/:id`
- 嗜好（entity）
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
  - `POST /api/entities/:id/images`
  - `PATCH /api/entities/:id/images/order`
  - `DELETE /api/entities/:id/images/:imageId`
  - `GET /api/entities/:id/images/:imageId/file`
- メンテナンス
  - `GET /api/maintenance/image-cleanup/tasks`
  - `POST /api/maintenance/image-cleanup/run`

## 4. 整合性ポリシー

### 4.1 D1 内の複数更新

- 複数SQLが必要な更新は `shared/db/unit-of-work.ts` の `runD1UnitOfWork` を使う。
- 例: 画像削除 + sort_order 詰め、画像並び替え。

### 4.2 D1/R2 を跨ぐ更新

- アップロード時: `R2 put -> D1 insert`。
  - D1 insert 失敗時は R2 delete を試行し、失敗時は cleanup task を enqueue。
- 削除時: `D1 metadata delete -> R2 delete`。
  - R2 delete 失敗時は cleanup task を enqueue（enqueue 失敗時のみ 500）。
- 補償処理
  - 手動実行: `POST /api/maintenance/image-cleanup/run`
  - 定期実行: cron `*/30 * * * *`（`scheduled.ts`）

## 5. 実行環境とバインディング

- `AUTH_BASE_URL`: 外部認証 API ベース URL
- `DB`: D1
- `ENTITY_IMAGES`: R2 バケット
- `ASSETS`: フロント静的配信

設定元: `apps/api/wrangler.toml`

## 6. 品質ゲート

- `npm --workspace @shikouroku/api run check`
- `npm --workspace @shikouroku/api run test`
- `npm --workspace @shikouroku/api run test:architecture`
- `npm --workspace @shikouroku/api run test:integration`

境界回帰は `tests/architecture/*` で検知します（route 層の legacy 依存禁止、module 外 `infra` 直参照禁止など）。

## 7. 残課題

1. D1/R2 跨ぎ処理の「失敗時ポリシー」をユースケース単位で明文化し、統合テストを増やす。
2. 認証を含む代表フローの E2E を追加し、運用回帰を早期検知する。
3. メンテナンス API の運用指標（失敗率、残タスク数）を可視化する。

## 8. 再開ガイド

### 8.1 現在地（2026-02-23時点）

- 対象: `apps/api/src`
- 品質ゲート最終結果:
  - `npm --workspace @shikouroku/api run check` 通過
  - `npm --workspace @shikouroku/api run test` 通過（`41 files / 108 tests`）
- 改修進捗:
  - Phase 0-2: 完了
  - Phase 3: 進行中（未完了: 複数リソース跨りの整合性境界の最終統一）
  - Phase 4: 実質完了（命名/依存/回帰ガード）

### 8.2 再開手順（毎回）

1. `git status --short`
2. `git log --oneline -n 12`
3. `npm --workspace @shikouroku/api run check`
4. `npm --workspace @shikouroku/api run test`
5. 本章「8.3 次の優先タスク」から 1 件選んで着手

### 8.3 次の優先タスク

- [ ] 複数リソース跨りの整合性境界を最終統一する（ユースケース単位で失敗ポリシーを固定）。
- [ ] `uploadEntityImageCommand` の `R2 put -> D1 insert` 境界戦略を明文化し、異常系テストを追加する。
- [ ] architecture test を段階的に厳格化し、ports 未経由の外部依存を検知する。
- [ ] 認証 -> entity 作成 -> 画像操作 -> 関連付けの代表 E2E を追加する。

### 8.4 再開基準コミット

- `4a09c33` refactor(api): batch image delete and sort-order collapse
- `cd6871d` refactor(api): batch entity upsert and tag replacement in one unit of work
- `b6c2367` test(api): add global guard for cross-module infra imports
- `bdf8967` refactor(api): route maintenance cleanup application through ports
- `f1c324b` refactor(api): inject external ports into image application
- `cb3d82b` refactor(api): route relation application through ports
