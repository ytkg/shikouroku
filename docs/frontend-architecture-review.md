# フロントエンド構成レビュー（2026-02-19）

対象: `apps/web/src`  
目的: メンテナンス性とバグ混入率の観点で、ディレクトリ戦略・命名規約を再評価し、再設計方針を定義する。

## 0. 進捗サマリー（2026-02-19時点）

- 実施済み:
  - Step 1: API呼び出しを `*.client.ts` + `shared/api` へ集約
  - Step 2: `new/edit` ページのロジックを `features` へ分離
  - Step 3: `features/*/index.ts` を公開境界として導入
  - Step 4: `select/textarea/checkbox` を `shared/ui/form-controls` に統一
  - Step 5: ESLint + CI品質ゲート（lint/test/typecheck）を導入
  - Step 6: `README.md` と `components.json` を現行構成へ同期
- 追加実施:
  - `home/detail/login` も `features` 側へ分離し、`pages` は薄いラッパー化
  - ルート/APIパスを `shared/config` へ定数化
  - `pages` / `widgets` のバレルエクスポートを導入し、`app` からのdeep importを抑制
  - `app` / `pages` の `default export` を廃止し、命名付きexportへ移行
  - ESLintで `import/no-default-export` を有効化し、再発を防止
  - `use-entities-api.ts` を query/mutation単位へ分割
  - `TagEditDialog` を `manage-tags` featureへ移設
  - `pages/*/page.tsx` 形式へリネーム
  - 一覧フィルタロジックを純粋関数化し、設定値/ルート/APIキーのユニットテストを追加
  - create/edit 間で重複していたタグ選択ロジックを `shared/model` に共通化
  - CI品質ゲートを `npm run lint/test/typecheck` に統一し、ワークスペース全体で検証
  - ESLintで `/api` と主要ルート文字列のハードコードを禁止
  - APIレスポンスの実行時バリデーションを導入し、不正なJSON形状を `ApiError(502)` として早期検知
  - `features` 層の deep import（`@/features/*/*`）をESLintで禁止し、同一featureは相対importへ統一

## 1. Findings（重大度順）

### Critical-1: ページが複数責務を抱えすぎており、変更時の回帰リスクが高い

- 根拠:
  - `apps/web/src/pages/entity-edit-page.tsx:18`
  - `apps/web/src/pages/entity-edit-page.tsx:57`
  - `apps/web/src/pages/entity-edit-page.tsx:111`
  - `apps/web/src/pages/new-entity-page.tsx:23`
  - `apps/web/src/pages/new-entity-page.tsx:83`
  - `apps/web/src/pages/home-page.tsx:29`
- 問題:
  - 1ファイル内に「API連携」「エラー制御」「認証分岐」「フォーム状態」「表示ロジック」が混在。
  - 修正箇所の局所化ができず、UI変更時にデータ処理へ副作用を起こしやすい。
- 推奨:
  - Pageは「画面構成とルーティング連携」に限定し、ロジックは `features/*/model` へ分離。
  - 1コンポーネントは1責務（表示 or 操作）に寄せる。

### Critical-2: APIアクセスの責務境界が崩れており、認証・エラー処理が分散している

- 根拠:
  - `apps/web/src/pages/login-page.tsx:21`
  - `apps/web/src/widgets/footer/ui/app-footer.tsx:10`
  - `apps/web/src/features/entities/api/entities-api.ts:56`
- 問題:
  - 一部は `features/entities/api` を利用し、一部はUIコンポーネントが直接 `fetch` している。
  - エラーフォーマット・再試行・認証失効時の挙動が統一されず、バグ温床になる。
- 推奨:
  - `shared/api/http-client.ts` + 各ドメイン `*.client.ts` にAPI呼び出しを集約。
  - UI層から `fetch` を禁止し、全通信をQuery/Mutation hook経由に統一。

### High-1: ディレクトリ戦略が形だけで、内部実装への深い依存が発生している

- 根拠:
  - `apps/web/src/pages/home-page.tsx:4`
  - `apps/web/src/pages/entity-edit-page.tsx:7`
  - `apps/web/src/pages/entity-edit-page.tsx:14`
  - `apps/web/src/pages/entity-edit-page.tsx:15`
- 問題:
  - `pages` が `features/*/api` や `features/*/model` の内部ファイルを直接参照。
  - `features` 配下の内部構成変更が、広範囲のimport破壊につながる。
- 推奨:
  - 各スライスで `index.ts` を公開境界にする。
  - `pages` は `features/*` の Public API のみ参照可能に制限。

### High-2: 命名が責務と一致しておらず、認知負荷を上げている

- 根拠:
  - `apps/web/src/features/entities/model/use-entities-api.ts:34`
  - `apps/web/src/features/entities/model/use-entities-api.ts:38`
  - `apps/web/src/features/entities/model/entity-types.ts:1`
  - `apps/web/src/app/router.tsx:10`
- 問題:
  - `use-entities-api.ts` が `kinds`/`tags` まで持ち、名前と責務が乖離。
  - `entity-types.ts` が `Kind`/`Tag` を同居させ、境界が曖昧。
  - `router.tsx` の default export が `App` 名称で、ファイル名との対応が弱い。
- 推奨:
  - ファイル名は責務を直接表す（例: `entity.query.ts`, `tag.mutation.ts`）。
  - default exportを極力廃止し、命名付きexportでリネーム事故を減らす。

### Medium-1: フォーム要素のクラス重複が多く、UI不整合を生みやすい

- 根拠:
  - `apps/web/src/pages/new-entity-page.tsx:128`
  - `apps/web/src/pages/new-entity-page.tsx:148`
  - `apps/web/src/pages/entity-edit-page.tsx:156`
  - `apps/web/src/pages/entity-edit-page.tsx:175`
- 問題:
  - `select` や `textarea` のTailwindクラスを手書きで重複管理。
  - 見た目・アクセシビリティ修正が横展開されず、差分が発生しやすい。
- 推奨:
  - `shared/ui/form-controls` に `SelectField` / `TextareaField` / `CheckboxField` を定義。
  - 見た目は `cva` でvariant管理し、UI差分を型で制御する。

### Medium-2: 設定/ドキュメントと実体の命名がズレている

- 根拠:
  - `apps/web/components.json:14`
  - `README.md:36`
  - `README.md:37`
- 問題:
  - shadcn alias や README のパス記述が現行構成と不一致。
  - 新規開発者が誤ったパスに実装しやすい。
- 推奨:
  - `components.json` の alias を `@/shared/ui`, `@/shared/lib` へ同期。
  - README の構成説明を現状または新設計に合わせて更新。

## 2. 推奨ターゲット構成（大幅変更案）

```txt
apps/web/src
├─ app
│  ├─ providers
│  │  ├─ router-provider.tsx
│  │  └─ query-provider.tsx
│  ├─ router
│  │  └─ app-routes.tsx
│  └─ layout
│     └─ root-layout.tsx
├─ pages
│  ├─ home
│  │  └─ page.tsx
│  ├─ entity-detail
│  │  └─ page.tsx
│  ├─ entity-edit
│  │  └─ page.tsx
│  ├─ entity-create
│  │  └─ page.tsx
│  └─ login
│     └─ page.tsx
├─ features
│  ├─ auth
│  │  ├─ login
│  │  │  ├─ model
│  │  │  │  └─ use-login-form.ts
│  │  │  ├─ ui
│  │  │  │  └─ login-form.tsx
│  │  │  └─ index.ts
│  │  └─ logout
│  │     ├─ model
│  │     │  └─ use-logout.ts
│  │     └─ index.ts
│  └─ entities
│     ├─ edit-entity
│     │  ├─ model
│     │  │  └─ use-edit-entity-form.ts
│     │  ├─ ui
│     │  │  └─ edit-entity-form.tsx
│     │  └─ index.ts
│     ├─ create-entity
│     ├─ filter-entities
│     └─ manage-tags
├─ entities
│  ├─ entity
│  │  ├─ api
│  │  │  ├─ entity.client.ts
│  │  │  ├─ entity.query.ts
│  │  │  └─ entity.mutation.ts
│  │  ├─ model
│  │  │  └─ entity.types.ts
│  │  ├─ ui
│  │  │  └─ entity-card.tsx
│  │  └─ index.ts
│  ├─ kind
│  │  ├─ api/kind.client.ts
│  │  ├─ model/kind.types.ts
│  │  └─ index.ts
│  └─ tag
│     ├─ api/tag.client.ts
│     ├─ model/tag.types.ts
│     └─ index.ts
└─ shared
   ├─ api
   │  ├─ http-client.ts
   │  └─ api-error.ts
   ├─ lib
   │  ├─ result.ts
   │  └─ utils.ts
   ├─ ui
   │  ├─ primitives
   │  └─ form-controls
   └─ config
      └─ route-paths.ts
```

## 3. 依存ルール（バグ混入を減らすための強制ルール）

- `app` は全層を参照可。
- `pages` は `features`, `entities`, `shared` のみ参照可。
- `features` は `entities`, `shared` のみ参照可。
- `entities` は `shared` のみ参照可。
- `shared` は `shared` 内のみ参照可。
- 各スライス外からの参照は `index.ts`（Public API）経由のみ。

導入推奨:
- `eslint-plugin-boundaries` または `import/no-restricted-paths` で依存違反をCIでブロック。

## 4. 命名規約（推奨）

- ディレクトリ: kebab-case（例: `manage-tags`）
- Reactコンポーネント名: PascalCase（例: `TagEditDialog`）
- フック: `use-*.ts` / 関数名 `useXxx`
- 型: `*.types.ts`（`entity.types.ts`, `tag.types.ts`）
- APIクライアント: `*.client.ts`
- Query/Mutation: `*.query.ts`, `*.mutation.ts`
- スキーマ: `*.schema.ts`
- ルートページ: `pages/*/page.tsx`
- default export: 原則禁止（例外は `main.tsx` などエントリのみ）

## 5. 優先移行ステップ

1. API統一: `login/logout` を含む全 `fetch` を `*.client.ts` へ移動。  
2. ページ分割: `entity-edit-page.tsx`, `new-entity-page.tsx` を feature単位に分解。  
3. Public API化: `features/*` / `entities/*` に `index.ts` を追加し深いimportを禁止。  
4. UI統一: `select/textarea/checkbox` を `shared/ui/form-controls` 化。  
5. ルール強制: ESLintで依存境界・命名規約をCI必須化。  
6. ドキュメント同期: `README.md` と `components.json` の命名/パスを実体へ合わせる。  

## 6. 期待効果

- 変更影響範囲の局所化により、回帰バグ調査時間を短縮。
- 命名から責務が推測できるため、オンボーディングコストを削減。
- 依存ルール違反を静的検査で防ぎ、設計崩壊を早期に検知。

## 7. 残タスク（優先順）

- 主要な再設計タスクは完了。次は機能追加時に同ルールを維持する運用フェーズ。  
