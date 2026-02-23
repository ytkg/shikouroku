# ドキュメント一覧（2026-02-23）

`docs/` は「現行仕様の共有」を目的とし、作業メモや一時的な再開メモは原則置かない方針で運用しています。

## 1. 収録ドキュメント

| ファイル | 用途 | 更新タイミング |
| --- | --- | --- |
| `docs/backend-architecture-review.md` | API/Worker 側の現行構成、依存境界、運用方針 | バックエンド構成や運用手順を変更したとき |
| `docs/frontend-architecture-review.md` | Web 側のレイヤ構成、依存ルール、品質ゲート | フロント構成や境界ルールを変更したとき |
| `docs/preference-feature-spec.md` | 関連嗜好（entity relation）機能の実装仕様 | 関連嗜好の UI/API/業務ルールを変更したとき |
| `docs/image-attachment-feature-spec.md` | 画像添付機能の実装仕様 | 画像 UI/API/業務ルールを変更したとき |
| `docs/product-growth-roadmap.md` | 次フェーズの機能拡張計画 | 優先度や実装順序を見直したとき |

## 2.5 アーカイブ

- 完了済みの検討メモや参照頻度の低い資料は `docs/archive/` へ移動する。
- 現在のアーカイブ:
  - `docs/archive/frontend-component-splitting-candidates.md`

## 2. 運用ルール

1. 実装済みの事実と今後の計画を分離する（仕様書とロードマップを混在させない）。
2. 履歴の羅列より「いまの正」を優先する。
3. 一時的な再開メモは原則 Issue/PR コメントへ残し、恒久的に残す内容は各構成ガイドへ統合する。
4. 不要になったドキュメントは削除し、残す場合はタイトルと更新日を必ず更新する。

## 3. 今回の整理内容

- 更新: `docs/backend-architecture-review.md` に再開ガイドを統合し、単独運用に整理
