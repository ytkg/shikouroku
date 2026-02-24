# フロントエンド構成ガイド

- 更新日: 2026-02-23
- 対象: `apps/web/src`
- 種別: 構成ガイド

## 1. 目的

- 現行のレイヤ構成と依存ルールを保守可能な形で共有する。
- API 呼び出しと画面ロジックの責務境界を明確にする。

## 2. レイヤ構成（現行）

- `app`: ルーターとアプリ全体配線
- `pages`: ルート単位の薄いラッパー
- `widgets`: 画面共通部品（ヘッダー/フッター）
- `features`: ユースケース単位の UI/状態管理
- `entities`: ドメイン単位の API/model
- `shared`: 共通 UI・API 基盤・設定・ユーティリティ

## 3. 依存ルール

- `shared` は上位レイヤ（`entities/features/pages/app/widgets`）を import しない。
- `entities` は `shared` のみ参照し、`features` 以上を参照しない。
- `features` は `entities/shared` のみ参照し、`widgets/pages/app` を参照しない。
- `app/pages/widgets` は `features/entities` の deep import をしない。
- 各スライス外からの参照は `index.ts`（public API）経由。

上記は `apps/web/tests/architecture/*` で静的検査しています。

## 4. API 層のルール

- `fetch` 呼び出しは `shared/api/http.client.ts` に限定。
- API クライアントは `entities/*/api/*.client.ts` に配置。
- レスポンス検証は対応する `*.response.ts` で実行。
- API パスとルートパスは `shared/config/api-paths.ts` / `shared/config/route-paths.ts` に集約。

## 5. 主要画面の責務

- `LoginPage`
  - ログイン API 呼び出しと認証ガード
- `HomePage`
  - 一覧、検索、種別フィルタ、wishlist フィルタ、ページング
- `EntityDetailPage`
  - 詳細表示、関連嗜好表示、画像プレビュー（前へ/次へ）
- `NewEntityPage`
  - entity 作成、関連嗜好追加、画像アップロード（失敗分再試行）
- `EntityEditPage`
  - entity 更新、関連嗜好差分更新、画像追加/削除/並び替え

## 6. 品質ゲート

- `npm run lint`
- `npm run test:unit`
- `npm run test:architecture`
- `npm run typecheck`

CI では上記を分離実行し、lint/ユニット/アーキテクチャ/型の回帰を個別に検知します。

## 7. やること

- [ ] UI 統合テスト（ルーティング + フォーム + API 失敗系）を拡充する
- [ ] 主要画面の回帰検知を、ユニット中心から統合寄りへ段階的に移行する
- [ ] エラーメッセージ文言の運用ルール（UX 文言と技術文言の分離）を明文化する

## 8. やったこと

- [x] レイヤ構成（app/pages/widgets/features/entities/shared）を定義した
- [x] アーキテクチャテストで依存境界の静的検査を運用している
- [x] API 層の責務分割（http client / client / response）を明文化した
