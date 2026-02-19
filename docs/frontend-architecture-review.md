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
  - `auth/entities` APIクライアント統合テストを追加し、`fetch -> client` 経路の検証を固定化
  - `src/entities/entity` を新設し、`features/entities` の model/api を移管（types/query/mutation/client/response）
  - ESLintに `entities` 層ルールを追加し、`app/pages/widgets/features` からの依存境界を強化
  - `api/*.client.ts` と `api/*.response.ts` のペア存在を検証するアーキテクチャテストを追加
  - `src/entities/auth` を新設し、`features/auth/api` を移管
  - `api/*.client.ts` が `*.response.ts` の parser を利用しているかをASTベースで検証
  - レイヤ境界（shared/entities/features/app/pages/widgets）の import ルールを静的テストで検証
  - 相対importでトップレイヤをまたぐ参照を禁止する静的テストを追加（aliasルール迂回を防止）
  - `test:architecture` を追加し、アーキテクチャ検証テストを独立実行可能にした

## 1. Findings（重大度順）

### Medium-1: テストは単体中心で、UI統合（フォーム+ルーティング+API失敗系）の担保が不足

- 根拠:
  - `apps/web/tests/features/**/*.test.ts`（純粋関数/クライアント中心）
  - `apps/web/tests/shared/**/*.test.ts`
- 問題:
  - Hooks/UI連携で起きる回帰（例: 401時の遷移、フォーム送信失敗時表示）の検知はまだ弱い。
- 推奨:
  - Testing Library + MSW で `create/edit/login` の統合テストを追加する。

### Medium-2: UI統合テスト導入のための依存が未導入（ネットワーク制約）

- 根拠:
  - `apps/web/package.json`（`jsdom` / Testing Library 未導入）
  - 依存導入時の `ENOTFOUND registry.npmjs.org`
- 問題:
  - UI統合テストを追加したくても依存導入ができず、現時点では実装を進められない。
- 推奨:
  - ネットワーク到達性を確保後、`jsdom` / `@testing-library/react` / `@testing-library/user-event` を追加する。

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

1. UI統合テスト: `login/create/edit` の主要フロー（成功/失敗/401）を Testing Library + MSW で追加。  
2. テスト基盤整備: UI統合テスト向け依存を導入可能な環境を確保。  
3. ルール維持: 既存の import 境界・命名規約をCIで継続監視し、例外運用を増やさない。  

## 6. 期待効果

- 変更影響範囲の局所化により、回帰バグ調査時間を短縮。
- 命名から責務が推測できるため、オンボーディングコストを削減。
- 依存ルール違反を静的検査で防ぎ、設計崩壊を早期に検知。

## 7. 残タスク（優先順）

- ドメイン分離とAST検証は完了。次は UI統合テスト拡充（依存導入環境の解消）が重点。  
