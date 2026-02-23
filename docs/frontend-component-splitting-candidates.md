# フロントエンド コンポーネント分割候補（2026-02-23）

対象: `apps/web/src/features/entities`

## 1. 目的

- コンポーネント分割の優先度を明確化し、改修順序の判断材料にする。
- 「行数が多い」だけでなく、責務の混在・重複・テストしにくさを基準に候補を整理する。

## 2. 選定基準

1. 1 コンポーネント内に UI 描画・副作用・遷移制御が混在している。
2. JSX ブロックが大きく差分レビューしにくい（目安: 150 行超）。
3. 近い構造やロジックが複数ファイルに重複している。

## 3. 分割候補（優先度順）

| 優先度 | 対象 | 現状の課題 | 推奨分割 |
| --- | --- | --- | --- |
| 高 | `apps/web/src/features/entities/detail/ui/entity-detail-page-content.tsx`（335 行） | 詳細表示、タグ遷移、画像サムネイル、画像プレビュー modal、キーボード操作、関連嗜好表示を 1 ファイルで担当。状態 (`selectedImageId`)、副作用 (`useEffect` 群)、描画責務が密結合。 | `EntityDetailSummarySection`、`EntityDetailImageGallery`、`EntityImagePreviewModal`、`EntityDetailRelatedSection` に分割。画像プレビュー操作は `useImagePreviewNavigation` のような hook 抽出を検討。 |
| 高 | `apps/web/src/features/entities/list/ui/entity-list-page-content.tsx`（292 行） | 種別タブ、検索オプション、結果カード、無限スクロール監視を単一コンポーネントで処理。`IntersectionObserver` の副作用と結果描画が同居し、一覧 UI 修正時の影響範囲が広い。 | `EntityListFilterPanel`、`EntitySearchOptions`、`EntityListResultCard`、`EntityListLoadMore` に分割。無限スクロール監視は `useInfiniteLoadTrigger` に切り出す。 |
| 高 | `apps/web/src/features/entities/edit/ui/edit-entity-page-content.tsx`（195 行）<br>`apps/web/src/features/entities/create/ui/create-entity-page-content.tsx`（156 行） | 画像入力 UI が `beforeRelatedContent` に大きく埋め込まれ、create/edit で構造が重複。`toFileSizeLabel` も重複実装。 | `EntityImageUploadField`（新規向け）と `EntityImageEditorField`（編集向け）を独立コンポーネント化。`toFileSizeLabel` は `shared/lib` へ移動して共通化。 |
| 中 | `apps/web/src/features/entities/manage-tags/ui/tag-edit-dialog.tsx`（187 行） | modal 表示、フォーム状態、API 呼び出し、削除確認、エラー表示まで 1 つに集約。見た目の責務と状態遷移責務が分離されていない。 | `useTagEditDialogState`（状態・副作用）と `TagEditDialogView`（表示）に分離。タグ一覧部分は `TagListEditor` として独立可能。 |
| 中 | `apps/web/src/features/entities/manage-related/ui/related-entity-edit-dialog.tsx`（85 行） | 行数は小さいが、overlay 構造・ESC 閉じ処理が他 dialog（タグ編集・画像プレビュー）と重複。 | `shared/ui` に `ModalShell`（overlay + close 処理）を作り、各 dialog は中身だけを持つ構成に寄せる。 |
| 中 | `apps/web/src/features/entities/shared/ui/entity-form-fields.tsx`（145 行） | 汎用フォームとして十分機能している一方、`beforeRelatedContent` スロットと related 表示の条件分岐で責務が増加。今後フィールド追加時に肥大化しやすい。 | `EntityBasicFields`、`EntityTagField`、`EntityRelatedField` の 3 つに段階分割。`beforeRelatedContent` は `imageField` など用途別 prop に限定する。 |

## 4. 着手順（推奨）

1. `ModalShell` を先に作成し、`TagEditDialog` と `RelatedEntityEditDialog` へ適用して重複を解消する。
2. `EntityDetailPageContent` の画像周り（サムネイル + プレビュー）を先行分割する。
3. `EntityListPageContent` のフィルタ UI と結果カードを分割し、無限スクロール監視を hook 化する。
4. create/edit の画像フィールドと `toFileSizeLabel` 共通化を実施する。
5. 最後に `EntityFormFields` を段階分割し、将来拡張に備える。

## 5. 補足（重複の確認ポイント）

- dialog の overlay 構造重複:
  - `apps/web/src/features/entities/manage-tags/ui/tag-edit-dialog.tsx`
  - `apps/web/src/features/entities/manage-related/ui/related-entity-edit-dialog.tsx`
  - `apps/web/src/features/entities/detail/ui/entity-detail-page-content.tsx`
- ファイルサイズ表示関数の重複:
  - `apps/web/src/features/entities/create/ui/create-entity-page-content.tsx`
  - `apps/web/src/features/entities/edit/ui/edit-entity-page-content.tsx`
