# Web データ取得ガイド

- 更新日: 2026-03-05
- 対象: `apps/web`
- 種別: 構成ガイド
- バージョン: v1

## 1. 目的

- `apps/web` のデータ取得を同じ方針で実装し、改修時の回帰を減らす。
- 特に `SWR key` と `再検証` の判断基準を統一する。

## 2. 背景・前提

- APIアクセスは `src/shared/api/http.client.ts` を経由する。
- parser は `src/entities/*/api/*.response.ts` に配置する。
- client は `src/entities/*/api/*.client.ts` に配置する。
- hook は `src/entities/*/model/*.query.ts` に配置する。

## 3. 方針

### 3.1 SWR key の設計

- key は `src/entities/*/model/*.query.ts` の定数/関数で定義し、UI層に文字列を直書きしない。
- 一覧 key と詳細 key は必ず分離する（例: `ENTITIES_KEY` と `entityKey(id)`）。
- 関連データ key（画像・関連嗜好）は親 entity id を含める。

### 3.2 取得単位

- API client は「1 API 呼び出し = 1 関数」を原則とする。
- 複数ページ取得などの合成処理は helper に分離する（client本体に埋め込まない）。
- 変換/検証は parser に集約し、hook/UI で `response.json()` を扱わない。

### 3.3 再検証ポリシー

- 変更系（create/update/delete/reorder）後は影響する key のみ mutate する。
- 画面復帰時の自動再検証は必要最小限にし、不要な全体再検証を避ける。
- 認証状態に依存するエラー処理は `resolveQueryError` と `useAuthGuard` 経由で統一する。

### 3.4 置き場所ルール

- API path は `src/shared/config/api-paths.ts` を唯一の定義源とする。
- URLエンコードは `src/shared/lib/url.ts` だけを利用する。
- 新規 client 追加時は unit test を `tests/features/**/api/*-client.test.ts` に追加する。

## 4. やること

- [ ] `entities` 以外の slice に同ガイドを適用し、SWR key 命名を揃える
- [ ] 変更系 mutation 後の `mutate` ポリシーを sliceごとにドキュメント化する

## 5. やったこと

- [x] `entities.client` の検索クエリ構築・ページング合成を helper 分離した
- [x] `images.client` / `related.client` の mutation 呼び出しを共通化した
- [x] 本ガイドを追加し、SWR key / 再検証方針を明文化した
