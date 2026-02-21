# 嗜好関連機能 仕様ドラフト（壁打ち用）

対象: `apps/web` / `apps/api` の「嗜好（Entity）」機能  
目的: 機能開発前に、現行仕様を整理しつつ未決事項を明確化する

## 1. スコープ

- 対象機能
  - 嗜好一覧
  - 嗜好詳細
  - 嗜好新規作成
  - 嗜好編集
  - タグ追加/削除（ダイアログ）
- 関連マスタ
  - 種別（Kind）
  - タグ（Tag）
- 認証
  - 未認証時のログイン遷移（401）

## 2. データ定義

### 2.1 嗜好（Entity）

- `id: string`（UUID）
- `kind: { id: number; label: string }`
- `name: string`
- `description: string | null`
- `isWishlist: boolean`
- `tags: { id: number; name: string }[]`
- `createdAt?: string`
- `updatedAt?: string`

### 2.2 種別（Kind）

- `id: number`
- `label: string`

### 2.3 タグ（Tag）

- `id: number`
- `name: string`

## 3. 画面仕様（現行）

### 3.1 一覧（`/`）

- タブ
  - `すべて`
  - `種別タブ（kind:{id}）`
  - `気になる`
- 表示ルール（現行ロジック）
  - `すべて`: `isWishlist = false` のみ表示
  - `種別タブ`: `isWishlist = false` かつ該当 `kind.id` のみ表示
  - `気になる`: `isWishlist = true` のみ表示
- カードクリックで詳細へ遷移

### 3.2 新規作成（`/entities/new`）

- 入力
  - 種別（必須）
  - 名前（必須）
  - メモ（任意）
  - タグ（任意・複数選択）
  - 気になる（boolean）
- 登録成功時
  - 画面下に登録結果JSONを表示
  - フォーム項目をリセット（種別は維持）

### 3.3 詳細（`/entities/:entityId`）

- 表示
  - 名前、種別、メモ、タグ、ID
- 操作
  - 編集画面へ遷移
  - 一覧へ戻る

### 3.4 編集（`/entities/:entityId/edit`）

- 新規と同等の項目を表示
- 保存成功時に詳細へ遷移

### 3.5 タグ編集ダイアログ

- 機能
  - タグ追加
  - タグ削除（確認ダイアログあり）
- 追加成功時は選択タグへ自動追加
- 削除成功時は選択タグから自動除外

## 4. API仕様（現行）

### 4.1 取得系

- `GET /api/kinds` -> `{ ok: true, kinds: Kind[] }`
- `GET /api/tags` -> `{ ok: true, tags: Tag[] }`
- `GET /api/entities` -> `{ ok: true, entities: Entity[] }`（最大50件）
- `GET /api/entities/:id` -> `{ ok: true, entity: Entity }`

### 4.2 更新系

- `POST /api/tags` body: `{ name }` -> `{ ok: true, tag }`
- `DELETE /api/tags/:id` -> `{ ok: true }`
- `POST /api/entities` body: `EntityBody` -> `{ ok: true, entity }`
- `PATCH /api/entities/:id` body: `EntityBody` -> `{ ok: true, entity }`

### 4.3 `EntityBody`

- `kindId: number`（必須・正整数）
- `name: string`（必須・trim後1文字以上）
- `description?: string`（trim、未指定は空文字）
- `isWishlist?: boolean`（未指定時 `false`）
- `tagIds?: number[]`（正整数配列、未指定時 `[]`）

## 5. 業務ルール（現行）

- `name` は `kindId + name` の組み合わせで重複不可（409）
- `tagIds` は重複排除して保存
- `tagIds` は全件存在チェック（1件でも不正なら400）
- `description` は空文字なら `null` として保存
- `isWishlist` はDB上 `0/1` で保持
- 一覧は `created_at DESC`、上限50件

## 6. エラー/認可

- 401: フロントでログイン画面へ遷移
- 404（Entity未存在）: `データが見つかりませんでした`
- ID不正: `嗜好 ID が不正です`
- 種別未選択: `種別を選択してください`
- タグ名空: `タグ名を入力してください`

## 7. 受け入れ条件（暫定）

- 一覧/詳細/新規/編集/タグ編集の主要導線がすべて動作する
- APIエラー時に画面が破綻せず、エラー表示またはログイン遷移になる
- 新規/編集で保存後、一覧・詳細の表示が最新状態に更新される
- 仕様化した業務ルール（重複、存在チェック、必須）を満たす

## 8. 壁打ちしたい論点（要決定）

1. `すべて` タブは `isWishlist=true` を含めるべきか  
現行は除外。仕様として意図通りか確認したい。

2. 一覧50件上限の扱い  
継続運用するか、ページング/無限スクロールを導入するか。

3. 重複判定の仕様  
`kindId + name` の大文字小文字・前後空白・全角半角をどこまで同一視するか。

4. 文字数制限  
`name` / `description` / `tag.name` の最大長を設けるか。

5. タグ削除の制約  
嗜好に紐づくタグでも削除可能（関連は全解除）。これを仕様として維持するか。

6. 作成成功後の挙動  
現行はフォームに留まり「登録結果JSON」を表示。詳細画面へ遷移に変えるか。

## 9. 次の進め方

- 上記「要決定」6点を確定
- 確定後、この文書を `v1` に更新
- `受け入れ条件` をE2E/統合テスト観点へ展開して実装開始
