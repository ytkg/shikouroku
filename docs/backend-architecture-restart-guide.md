# バックエンド改修 再開ガイド（2026-02-23）

このファイルは再開時のクイック入口です。  
内容の正本は `docs/backend-architecture-review.md` の「8. 再開ガイド」です。

## 1. 再開時に最初にやること

1. `git status --short`
2. `git log --oneline -n 12`
3. `npm --workspace @shikouroku/api run check`
4. `npm --workspace @shikouroku/api run test`

## 2. 未着手タスク（追跡用）

- [ ] 複数リソース跨りの整合性境界を最終統一する。
- [ ] `uploadEntityImageCommand` の境界戦略を明文化し、異常系テストを追加する。
- [ ] architecture test を段階的に厳格化する。
- [ ] 代表 E2E を追加する。

## 3. 参照先

- 詳細ガイド: `docs/backend-architecture-review.md`
