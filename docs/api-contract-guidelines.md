# API 契約ガイドライン

- 更新日: 2026-03-05
- 対象: `apps/api`, `apps/web`
- 種別: 構成ガイド
- バージョン: v1

## 1. 目的

- API の成功/失敗レスポンス契約を固定し、Web 側の挙動差分を最小化する。
- 互換性を壊す変更を明確化し、レビュー時に判断できるようにする。

## 2. レスポンス契約

### 2.1 成功レスポンス

- 形式: `{ ok: true, ...payload, requestId }`
- 主要契約テスト:
  - `apps/api/tests/contract/app/api-success-shape.contract.test.ts`

### 2.2 エラーレスポンス

- 形式: `{ ok: false, error: { code, message }, requestId }`
- `code` は HTTP ステータスに応じて標準化し、必要に応じて個別コードを使う。
- 主要契約テスト:
  - `apps/api/tests/contract/app/api-error-shape.contract.test.ts`

## 3. エラーコード運用

### 3.1 標準コード

- `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` などは `api-response` の変換ルールを基準とする。
- 実装基点: `apps/api/src/shared/http/api-response.ts`

### 3.2 個別コード

- 入力検証など利用者に具体理由を返す場合は個別コードを優先する。
- 例: `INVALID_ENTITY_LIMIT`, `INVALID_TAG_ID`, `INVALID_MULTIPART_BODY`

## 4. Web 側の扱い

- 認証切れ/未認証は `ensureAuthorized` に委譲し、表示エラーを更新しない。
- 実装基点:
  - `apps/web/src/shared/lib/query-error.ts`
  - `shouldKeepCurrentError`
  - `applyResolvedQueryError`
- API失敗時の文言は `toErrorMessage` と `resolveOperationErrorMessageKey` で統一する。

## 5. Breaking Change 判定

以下は breaking change とみなす。

1. 成功/失敗レスポンスのエンベロープ変更（`ok`, `error`, `requestId`）
2. 既存 `error.code` の意味変更または削除
3. 同一エンドポイントでの必須パラメータ追加（後方互換なし）
4. Web が依存する payload フィールドの削除または型変更

## 6. 変更時チェックリスト

- [ ] 契約変更がある場合、`tests/contract` を先に更新する
- [ ] Web 側 client/parser とエラー分岐を同PRで更新する
- [ ] breaking change 該当時は Issue/PR に移行方針を明記する
- [ ] `npm --workspace @shikouroku/api run test -- tests/contract/app/*` が通る

## 7. やったこと

- [x] 主要エラー契約（auth/tags/entities）を `api-error-shape.contract.test.ts` へ追加した
- [x] 成功契約（tags/auth-me）を `api-success-shape.contract.test.ts` へ追加した
- [x] Web 側の認証エラー分岐を共通ヘルパーへ統一した
