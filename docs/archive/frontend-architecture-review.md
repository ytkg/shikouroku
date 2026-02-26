# フロントエンド構成ガイド

- 更新日: 2026-02-26
- 対象: `apps/web/src`
- 種別: 構成ガイド

## 1. 目的

- 現行のレイヤ構成と依存境界を実装準拠で共有する。
- 画面責務・API 呼び出し境界・品質ゲートを一つの文書で追跡する。

## 2. レイヤ構成（現行）

- `app`: ルーター、SEO 設定、全体レイアウト配線
- `pages`: ルート単位の薄いラッパー（`features` 呼び出し専用）
- `widgets`: 画面共通部品（ヘッダー/フッター/FAB）
- `features`: ユースケース単位の UI/状態管理
- `entities`: ドメイン単位の API client/response/model
- `shared`: 共通 UI・API 基盤・設定・ユーティリティ

## 3. 依存ルール（architecture test 準拠）

- `shared` は上位レイヤ（`entities/features/widgets/pages/app`）を参照しない。
- `entities` は `shared` のみ参照し、`features` 以上を参照しない。
- `features` は `entities/shared` のみ参照し、`widgets/pages/app` を参照しない。
- `app/pages/widgets` は `features` / `entities` の deep import をしない。
- 相対 import でトップレイヤを跨がない（同一レイヤ内のみ）。
- `@/entities` / `@/features` のルート参照は禁止（スライス public API を明示指定）。
- `export default` と `export *` を禁止する。
- `features/*` と `entities/*` 直下には `index.ts`（public API）を必須化する。

上記は `apps/web/tests/architecture/*` で静的検査している。

## 4. API 境界ルール

- `fetch()` は `shared/api/http.client.ts` からのみ呼び出す。
- `requestJson()` は `entities/*/api/*.client.ts`（+ HTTP 境界）からのみ呼び出す。
- `response.json()` は `shared/api` 境界内からのみ呼び出す。
- `entities/*/api/*.client.ts` は対応 `*.response.ts` を必須とし、`parse*` 関数呼び出しを必須とする。
- API パス/画面ルートは `shared/config/api-paths.ts` / `shared/config/route-paths.ts` に集約する。
- 主要 HTTP ステータス（401/404/502）は `shared/config/http-status.ts` 経由で参照する。
- `encodeURIComponent` / `decodeURIComponent` は `shared/lib/url.ts` に閉じ込める。

## 5. 主要画面の責務

- `LoginPage`: ログイン API 実行、エラー表示、認証状態更新
- `HomePage`: 一覧、検索条件（種別/文字列/match/fields）、無限ロード、タグ起点フィルタ
- `EntityDetailPage`: 詳細表示、関連嗜好表示、画像プレビュー、タグ起点の一覧遷移
- `NewEntityPage`: entity 作成、タグ編集ダイアログ、関連嗜好選択、画像アップロード
- `EntityEditPage`: entity 更新、タグ/関連嗜好差分更新、画像追加/削除/並び替え
- `MapPage`: 位置情報付き entity の地図表示、タグ/名前フィルタ、モーダル詳細表示

## 6. 品質ゲート

- `npm run quality:web`（推奨の一括実行）
- `npm run lint`
- `npm run test:unit`
- `npm run test:architecture`
- `npm run typecheck`

## 7. やること

- [x] UI 統合テスト（ルーティング + フォーム + API 失敗系）を拡充する
- [x] `MapPage` の主要操作（フィルタ、モーダル、タグ再絞り込み）の統合テストを追加する
- [x] auth guard を伴う遷移（401 -> login -> returnTo 復帰）の統合テストを追加する

## 8. やったこと

- [x] レイヤ構成（`app/pages/widgets/features/entities/shared`）を定義した
- [x] API 境界（`fetch/requestJson/response.json`）を architecture test で固定した
- [x] public API (`index.ts`) と deep import 禁止ルールを architecture test で固定した
- [x] default export / export star 禁止を architecture test で固定した
