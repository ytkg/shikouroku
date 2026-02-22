# バックエンド改修 再開ガイド（2026-02-22時点）

このファイルは「次にどこから再開するか」だけに絞った運用メモです。  
詳細な背景・設計方針・履歴は `docs/backend-architecture-review.md` を参照してください。

## 1. 現在地（要約）

- 対象: `apps/api/src`
- 品質ゲート最終結果:
  - `npm --workspace @shikouroku/api run check` 通過
  - `npm --workspace @shikouroku/api run test` 通過（`41 files / 108 tests`）
- ロードマップ進捗:
  - Phase 0: 完了
  - Phase 1: 完了
  - Phase 2: 完了
  - Phase 3: 進行中（未完了: 「複数リソース跨りの整合性境界を統一」）
  - Phase 4: 実質完了（命名/依存/回帰ガード導入済み）

## 2. 再開手順（毎回これだけ実施）

1. ワークツリー確認:
   - `git status --short`
2. 直近の改修履歴確認:
   - `git log --oneline -n 12`
3. 型チェック:
   - `npm --workspace @shikouroku/api run check`
4. テスト実行:
   - `npm --workspace @shikouroku/api run test`
5. 次の作業対象をこのファイルの「3. 次の優先タスク」から1つ選ぶ。

## 3. 次の優先タスク（再開候補）

- [ ] Phase 3 完了:
  - 複数リソース跨りの整合性境界を最終統一する。
  - 例: DB更新と外部ストレージ操作の失敗時ポリシーをユースケース単位で固定し、テスト化する。
- [ ] imageアップロード系のさらなる一貫性強化:
  - `uploadEntityImageCommand` の `R2 put` -> `DB insert` の境界戦略を明文化し、異常系テストを追加する。
- [ ] 依存境界ガードの拡張:
  - 既存の architecture test を「ports未経由の外部依存禁止」に段階的に厳格化する。
- [ ] E2E追加（任意だが有効）:
  - 認証 -> エンティティ作成 -> 画像操作 -> 関連付けまでの代表フローを1本通す。

## 4. 直近の完了コミット（再開基準）

- `4a09c33` refactor(api): batch image delete and sort-order collapse
- `cd6871d` refactor(api): batch entity upsert and tag replacement in one unit of work
- `b6c2367` test(api): add global guard for cross-module infra imports
- `bdf8967` refactor(api): route maintenance cleanup application through ports
- `f1c324b` refactor(api): inject external ports into image application
- `cb3d82b` refactor(api): route relation application through ports

## 5. 関連ドキュメント

- 詳細レビュー: `docs/backend-architecture-review.md`
