# リリース前品質チェックリスト

- 更新日: 2026-03-05
- 対象: `apps/api`, `apps/web`, `.github/workflows`
- 種別: 構成ガイド

## 1. 目的

- リリース直前に実施する品質確認を明文化し、チェック漏れを防止する。

## 2. 実施手順

1. 依存・型・静的解析

- [ ] `npm ci`
- [ ] `npm run quality:web`
- [ ] `npm run quality:api`

2. カバレッジゲート

- [ ] `npm run test:coverage:web`
- [ ] `npm run test:coverage:api`

3. 統合観点の確認（最小）

- [ ] `npm --workspace @shikouroku/api run test -- tests/integration/maintenance-image-cleanup.integration.test.ts`
- [ ] `npm --workspace @shikouroku/api run test -- tests/integration/tags.integration.test.ts`
- [ ] `npm --workspace @shikouroku/api run test -- tests/integration/auth-flow.integration.test.ts`

4. 主要契約の確認

- [ ] `npm --workspace @shikouroku/api run test -- tests/contract/app/api-error-shape.contract.test.ts`
- [ ] `npm --workspace @shikouroku/api run test -- tests/contract/app/api-success-shape.contract.test.ts`

5. DB・運用観点（必要時）

- [ ] 本番投入前に migration の差分を確認
- [ ] 必要時のみ `d1:migrate:prod` を実行
- [ ] seed 実行可否を確認（通常は不要）

## 3. 完了条件

- [ ] CI（web-quality / api-quality）が green
- [ ] 上記チェックの未完了項目がない
- [ ] 既知のリスクが Issue または PR に明記されている
