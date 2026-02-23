# ドキュメント一覧（2026-02-23）

`docs/` は「現行仕様の共有」を目的とし、作業メモや一時的な再開メモは原則置かない方針で運用しています（`backend-architecture-restart-guide.md` は例外）。

## 1. 収録ドキュメント

| ファイル | 用途 | 更新タイミング |
| --- | --- | --- |
| `docs/backend-architecture-restart-guide.md` | バックエンド改修の再開チェックリスト（クイック入口） | 再開タスクや優先順位を更新したとき |
| `docs/backend-architecture-review.md` | API/Worker 側の現行構成、依存境界、運用方針 | バックエンド構成や運用手順を変更したとき |
| `docs/frontend-architecture-review.md` | Web 側のレイヤ構成、依存ルール、品質ゲート | フロント構成や境界ルールを変更したとき |
| `docs/frontend-component-splitting-candidates.md` | フロントエンドのコンポーネント分割候補と優先度 | 分割方針や着手順を見直したとき |
| `docs/preference-feature-spec.md` | 関連嗜好（entity relation）機能の実装仕様 | 関連嗜好の UI/API/業務ルールを変更したとき |
| `docs/image-attachment-feature-spec.md` | 画像添付機能の実装仕様 | 画像 UI/API/業務ルールを変更したとき |
| `docs/product-growth-roadmap.md` | 次フェーズの機能拡張計画 | 優先度や実装順序を見直したとき |

## 2. 運用ルール

1. 実装済みの事実と今後の計画を分離する（仕様書とロードマップを混在させない）。
2. 履歴の羅列より「いまの正」を優先する。
3. 一時的な再開メモは原則 Issue/PR コメントへ残す。`backend-architecture-restart-guide.md` は進行中大型改修の例外として保持し、`backend-architecture-review.md` の再開セクションと同期する。
4. 不要になったドキュメントは削除し、残す場合はタイトルと更新日を必ず更新する。

## 3. 今回の整理内容

- 維持: `docs/backend-architecture-restart-guide.md` を再開導線として保持
- 更新: `docs/backend-architecture-review.md` に再開ガイドを統合
