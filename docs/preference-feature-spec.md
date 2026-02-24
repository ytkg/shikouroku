# 関連嗜好機能仕様

- 更新日: 2026-02-23
- 対象: `apps/web` / `apps/api`
- 種別: 機能仕様
- バージョン: v1（実装済み）

## 1. 機能概要

- ある嗜好（entity）に別の嗜好を関連付ける。
- 関連は無向関係として扱う（A-B を 1 レコードで管理）。

## 2. 画面仕様

### 2.1 詳細画面

- 関連が 1 件以上ある場合のみ `関連嗜好` セクションを表示。
- 各関連嗜好は `名前（種別）` 形式で表示し、クリックで詳細へ遷移。

### 2.2 新規登録画面

- `関連を編集` ダイアログで候補を複数選択できる。
- entity 作成後に選択済み ID へ順次 `POST /related` を実行する。

### 2.3 編集画面

- `関連を編集` ダイアログで現在の関連を編集。
- 保存時に差分計算し、追加分は `POST`、削除分は `DELETE` を実行。
- `409 (already exists)` と `404 (already removed)` は冪等扱いで継続。

## 3. API 仕様

- `GET /api/entities/:id/related`
  - `200`: `{ ok: true, related: Entity[] }`
- `POST /api/entities/:id/related`
  - body: `{ relatedEntityId: string }`
  - `201`: `{ ok: true }`
- `DELETE /api/entities/:id/related/:relatedEntityId`
  - `200`: `{ ok: true }`

### 3.1 エラー

- `400`: 自己関連（`id === relatedEntityId`）
- `404`: entity 不在 / relation 不在
- `409`: 既存 relation の重複作成
- `401`: 未認証

## 4. データモデル

`entity_relations`

- 主キー: `(entity_id_low, entity_id_high)`
- 制約: `entity_id_low <> entity_id_high`
- 並び: `created_at DESC` で関連一覧を返却
- 保存時は ID の辞書順で正規化して重複を防止

## 5. 業務ルール

1. 自己関連は禁止。
2. 重複関連は禁止。
3. どちらかの entity が存在しない場合は作成/削除しない。
4. 片側で作成した関連は反対側詳細でも表示される。

## 6. テスト観点（現行）

- API parser/client の正常・異常系
- create/edit での関連選択ロジック（差分計算含む）
- API パス生成と URL エンコード

## 7. やること

- [ ] 関連候補取得のコストを、件数増加時でも抑える方法を検討する
- [ ] 関連候補の検索・ソート要件を定義する

## 8. やったこと

- [x] 無向関係の関連付け（A-B 単一レコード）を実装した
- [x] 新規/編集画面で関連の追加・削除差分同期を実装した
- [x] `409` と `404` を冪等扱いにして更新継続できるようにした

## 9. 既知の制約

- 関連候補は `GET /api/entities` から取得するため、件数増加時は取得コストが上がる。
- 関連候補の高度な検索・ソートは v1 対象外。
