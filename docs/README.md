# ドキュメント一覧

- 更新日: 2026-02-26
- 対象: `docs/`（`docs/archive/` を除く）
- 種別: 索引

`docs/` は「現行仕様の共有」を目的とし、作業メモや一時的な再開メモは原則置かない方針で運用します。

## 1. 収録ドキュメント

| ファイル | 用途 | 更新タイミング |
| --- | --- | --- |
| `docs/backend-architecture-review.md` | API/Worker 側の現行構成、依存境界、運用方針 | バックエンド構成や運用手順を変更したとき |
| `docs/preference-feature-spec.md` | 関連嗜好（entity relation）機能の実装仕様 | 関連嗜好の UI/API/業務ルールを変更したとき |
| `docs/image-attachment-feature-spec.md` | 画像添付機能の実装仕様 | 画像 UI/API/業務ルールを変更したとき |
| `docs/product-growth-roadmap.md` | 次フェーズの機能拡張計画 | 優先度や実装順序を見直したとき |

## 2. 運用ルール

1. 実装済みの事実と今後の計画を分離する（仕様書とロードマップを混在させない）。
2. 履歴の羅列より「いまの正」を優先する。
3. 一時的な再開メモは原則 Issue/PR コメントへ残し、恒久的に残す内容は各構成ガイドへ統合する。
4. 不要になったドキュメントは削除し、残す場合はタイトル直下の更新日を必ず更新する。
5. 新規ドキュメント作成時は `docs/_template.md` を起点にし、見出し構成とメタ情報形式を揃える。
6. `やること` と `やったこと` はチェックボックス形式（`- [ ]` / `- [x]`）で記載する。

## 3. アーカイブ

- 完了済みの検討メモや参照頻度の低い資料は `docs/archive/` へ移動する。
- 現在のアーカイブ:
  - `docs/archive/frontend-component-splitting-candidates.md`
  - `docs/archive/frontend-architecture-review.md`

## 4. やること

- [ ] 主要ドキュメントで `やること` / `やったこと` の更新漏れがないか定期確認する

## 5. やったこと

- [x] `docs/backend-architecture-review.md` に再開ガイドを統合し、単独運用に整理
- [x] `docs/_template.md` を追加し、書式の起点を統一した
- [x] `docs/product-growth-roadmap.md` を現行実装（地図/位置情報/検索）に合わせて更新した
