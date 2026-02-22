# バックエンド構成レビュー（2026-02-22）

対象: `apps/api/src`  
目的: メンテナンス性とバグ混入率の観点で、現行のディレクトリ戦略と命名規則を再評価し、全面的な再設計方針を提示する。

## 0. 進捗サマリー（2026-02-22）

- 実施済み（Phase 0の先行反映）:
  - `requestId` ミドルウェアを追加し、`X-Request-Id` を全レスポンスへ付与。
    - `apps/api/src/shared/http/request-id.ts`
    - `apps/api/src/index.ts`
  - エラーレスポンス形式を `error.code` / `error.message` / `requestId` に統一。
    - `apps/api/src/shared/http/api-response.ts`
    - `apps/api/src/lib/http.ts`
    - `apps/api/src/index.ts`
  - 認証APIのベースURLを環境変数化。
    - `apps/api/src/app-env.ts`
    - `apps/api/src/lib/auth-client.ts`
    - `apps/api/src/usecases/auth-usecase.ts`
    - `apps/api/wrangler.toml`
  - API側のテスト基盤を追加し、契約/ユニットテストを導入。
    - `apps/api/vitest.config.ts`
    - `apps/api/tests/unit/shared/http/api-response.test.ts`
    - `apps/api/tests/unit/lib/auth-client.test.ts`
    - `apps/api/tests/contract/http/parse-json-body.contract.test.ts`
    - `apps/api/package.json`
    - `package.json`
- 実施済み（Phase 1の一部反映）:
  - `index.ts` の責務を「アプリ配線」に縮小し、認証ミドルウェアとAPIルーターを分離。
    - `apps/api/src/index.ts`
    - `apps/api/src/middleware/auth-session-middleware.ts`
    - `apps/api/src/routes/api-router.ts`
  - APIルーターを機能別に分割し、変更単位を縮小。
    - `apps/api/src/routes/api/auth-routes.ts`
    - `apps/api/src/routes/api/kind-routes.ts`
    - `apps/api/src/routes/api/tag-routes.ts`
    - `apps/api/src/routes/api/entity-routes.ts`
    - `apps/api/src/routes/api/shared.ts`
  - 全体アプリに対するAPIエラー契約テストを追加。
    - `apps/api/tests/contract/app/api-error-shape.contract.test.ts`
- 実施済み（Phase 3の先行反映）:
  - 複数SQL更新の一部を `db.batch` 化し、部分成功による不整合リスクを低減。
    - `apps/api/src/repositories/entity-repository.ts`（`replaceEntityTags`）
    - `apps/api/src/repositories/entity-image-repository.ts`（`reorderEntityImages`）
    - `apps/api/src/repositories/tag-repository.ts`（`deleteTagAndRelations`）
  - 上記バッチ処理の回帰防止テストを追加。
    - `apps/api/tests/unit/repositories/repository-batch-safety.test.ts`
  - D1/R2跨り削除失敗に備えたクリーンアップキューを追加。
    - `apps/api/migrations/0008_create_image_cleanup_tasks.sql`
    - `apps/api/src/repositories/image-cleanup-task-repository.ts`
    - `apps/api/src/usecases/entity-images-usecase.ts`
  - クリーンアップタスク実行用のメンテナンスAPIを追加（手動実行）。
    - `apps/api/src/usecases/image-cleanup-usecase.ts`
    - `apps/api/src/routes/api/maintenance-routes.ts`
  - クリーンアップキュー参照APIを追加（一覧）。
    - `GET /api/maintenance/image-cleanup/tasks`
  - cron 実行で定期クリーンアップを追加。
    - `apps/api/src/index.ts`（`scheduled` ハンドラ）
    - `apps/api/wrangler.toml`（`[triggers].crons`）
  - クリーンアップキューのリポジトリ/ユースケーステストを追加。
    - `apps/api/tests/unit/repositories/image-cleanup-task-repository.test.ts`
    - `apps/api/tests/unit/usecases/entity-images-usecase.test.ts`
    - `apps/api/tests/unit/usecases/image-cleanup-usecase.test.ts`
    - `apps/api/tests/unit/routes/maintenance-routes.test.ts`
    - `apps/api/tests/unit/scheduled/image-cleanup-scheduled.test.ts`
- 実施済み（保守性改善の先行反映）:
  - `validationMessage` の if連鎖を辞書化し、更新漏れリスクを削減。
    - `apps/api/src/domain/schemas.ts`
  - バリデーションメッセージのユニットテストを追加。
    - `apps/api/tests/unit/domain/schemas.test.ts`
- 実施済み（運用品質の先行反映）:
  - API向け品質スクリプトを追加。
    - `package.json`（`quality:api`）
  - API向けCIワークフローを追加。
    - `.github/workflows/api-quality.yml`
  - 認証ミドルウェアのユニットテストを追加。
    - `apps/api/tests/unit/middleware/auth-session-middleware.test.ts`
  - アーキテクチャテストを追加し、命名規約とレスポンス契約逸脱を検知。
    - `apps/api/tests/architecture/file-naming-conventions.test.ts`
    - `apps/api/tests/architecture/route-response-contract.test.ts`
    - `apps/api/tests/architecture/usecase-schema-coupling.test.ts`
  - `entities-usecase` の `domain/schemas` 依存を除去し、HTTP入力型から分離。
    - `apps/api/src/usecases/entities-usecase.ts`
- Findingsへの反映状況:
  - `Critical-1`（複数更新の整合性）: **一部解消**（代表的な複数更新を `db.batch` 化）
  - `Critical-2`（D1/R2跨り整合性）: **大きく改善**（補償キュー + 手動実行API + cron定期実行を導入）
  - `High-3`（エラーレスポンス不統一）: **一部解消**（JSONエラー契約を統一、成功レスポンス契約は今後統一余地あり）
  - `High-2`（層混線/命名不整合）: **一部解消**（usecase の schema 依存を削減）
  - `Medium-1`（validationMessageの保守性）: **一部解消**（辞書化 + テスト追加）
  - `Medium-2`（認証URLハードコード）: **解消**
  - `Medium-3`（APIテスト不足）: **進捗中**（契約/ユニット + アプリ契約テスト + API CIを追加、統合テストは未実装）

## 1. Findings（重大度順）

### Critical-1: 複数更新処理の整合性境界が弱く、部分成功でデータ不整合が残り得る

- 根拠:
  - `apps/api/src/usecases/entities-usecase.ts:145`（作成）
  - `apps/api/src/usecases/entities-usecase.ts:179`（タグ関連の後続更新）
  - `apps/api/src/usecases/entities-usecase.ts:195`（更新）
  - `apps/api/src/usecases/entities-usecase.ts:231`（タグ更新）
  - `apps/api/src/repositories/tag-repository.ts:32`（タグと関連削除）
  - `apps/api/src/repositories/entity-image-repository.ts:117`（画像順序更新）
- 問題:
  - 1つのユースケース内で複数の永続化操作を実行しているが、失敗時の一貫性戦略が統一されていない。
  - 一部は手動ロールバック、他はロールバックなしで、回復不能な中間状態を作りやすい。
- 影響:
  - タグ付けだけ失敗、順序だけ破損、関連テーブルのみ更新済みなどの障害が起きる。

### Critical-2: R2 と DB の更新順序が不安定で、画像メタデータと実体が乖離し得る

- 根拠:
  - `apps/api/src/usecases/entity-images-usecase.ts:147`（アップロード失敗時のbest-effort削除）
  - `apps/api/src/usecases/entity-images-usecase.ts:184`（DB削除）
  - `apps/api/src/usecases/entity-images-usecase.ts:198`（R2削除）
- 問題:
  - DB先行削除後にR2削除が失敗すると、レスポンスはエラーだがDB側は削除済みになる。
  - 逆順でも別の不整合が起きるため、明示的な整合性ポリシーが必要。
- 影響:
  - 孤立オブジェクト、参照切れURL、再試行での挙動不定が発生する。

### High-1: `index.ts` に責務が集中し、変更衝突と回帰リスクが高い

- 根拠:
  - `apps/api/src/index.ts:44`（アプリ生成）
  - `apps/api/src/index.ts:70`（認証ミドルウェア）
  - `apps/api/src/index.ts:124`（ルート定義）
  - `apps/api/src/index.ts:359`（SPA配信）
  - `apps/api/src/index.ts` は 363行
- 問題:
  - ルーティング、認証、入力検証、レスポンス整形、SPAフォールバックが同居している。
- 影響:
  - 1箇所の変更が別責務へ波及しやすく、レビュー難度が上がる。

### High-2: ドメイン・永続化・API境界の型が混線し、命名が責務を表していない

- 根拠:
  - `apps/api/src/domain/models.ts:11`（DB由来の `*Row` を domain 配下に配置）
  - `apps/api/src/usecases/entities-usecase.ts:24`（API返却型名が `EntityResponseRow`）
  - `apps/api/src/usecases/entities-usecase.ts:1`（ユースケースが `domain/schemas` に依存）
  - `apps/api/src/repositories/entity-repository.ts:147`（entity repository が tag責務も処理）
- 問題:
  - `domain` ディレクトリが実質「型置き場」になっており、概念境界が曖昧。
  - `Row` / `Body` / `Response` の語が層と一致せず、誤用を招きやすい。

### High-3: エラーレスポンス契約が不統一で、クライアント実装と監視が複雑化

- 根拠:
  - `apps/api/src/index.ts:132`（`error` キー）
  - `apps/api/src/index.ts:149`（`message` キー）
  - `apps/api/src/index.ts:46`（`status as ContentfulStatusCode` キャスト）
- 問題:
  - 同一API内でエラー形式が混在しており、型安全なハンドリングが難しい。
  - ステータスキャストで不正値混入をコンパイル時に防げない。

### Medium-1: 入力バリデーションのエラーメッセージが手作業if連鎖で保守コストが高い

- 根拠:
  - `apps/api/src/domain/schemas.ts:34`
  - `apps/api/src/domain/schemas.ts:36`
  - `apps/api/src/lib/http.ts:24`
- 問題:
  - フィールド追加時に `validationMessage` の更新漏れが起きやすい。
  - スキーマ定義とメッセージ定義が分離し、追従コストが高い。

### Medium-2: 外部認証APIのエンドポイントがハードコードされ、環境切替が困難

- 根拠:
  - `apps/api/src/lib/auth-client.ts:1`
- 問題:
  - ステージング・障害迂回・テストダブル差し替えが難しい。

### Medium-3: バックエンド品質ゲート（テスト/静的境界検査）が不足

- 根拠:
  - `apps/api/package.json:6`（`test` / `lint` スクリプト不在）
  - `package.json:12`
  - `package.json:25`（品質ゲートがWeb中心）
- 問題:
  - ルーティング回帰、スキーマ破壊、SQL変更の退行を自動検知できない。

## 2. 推奨ターゲット構成（大幅変更案）

方針: **モジュラモノリス + Vertical Slice + Ports & Adapters**  
狙い: 「変更箇所の局所化」「責務の可視化」「不整合の起点削減」。

```txt
apps/api/src
├─ main.ts
├─ app
│  ├─ create-app.ts
│  ├─ router.ts
│  ├─ middleware
│  │  ├─ auth.middleware.ts
│  │  ├─ request-id.middleware.ts
│  │  ├─ error.middleware.ts
│  │  └─ access-log.middleware.ts
│  └─ http
│     ├─ api-response.ts
│     └─ problem-details.ts
├─ modules
│  ├─ auth
│  │  ├─ auth.route.ts
│  │  ├─ auth.controller.ts
│  │  ├─ auth.schema.ts
│  │  ├─ application
│  │  │  ├─ login.command.ts
│  │  │  ├─ refresh-token.command.ts
│  │  │  └─ verify-token.query.ts
│  │  ├─ ports
│  │  │  └─ auth-gateway.port.ts
│  │  └─ infra
│  │     └─ auth-gateway.http.ts
│  └─ catalog
│     ├─ entity
│     │  ├─ entity.route.ts
│     │  ├─ entity.controller.ts
│     │  ├─ entity.schema.ts
│     │  ├─ entity.dto.ts
│     │  ├─ application
│     │  │  ├─ commands
│     │  │  │  ├─ create-entity.command.ts
│     │  │  │  ├─ update-entity.command.ts
│     │  │  │  ├─ attach-image.command.ts
│     │  │  │  ├─ delete-image.command.ts
│     │  │  │  └─ reorder-images.command.ts
│     │  │  └─ queries
│     │  │     ├─ get-entity.query.ts
│     │  │     ├─ list-entities.query.ts
│     │  │     └─ list-related-entities.query.ts
│     │  ├─ domain
│     │  │  ├─ entity.ts
│     │  │  ├─ entity-id.ts
│     │  │  ├─ image.ts
│     │  │  └─ catalog-error.ts
│     │  ├─ ports
│     │  │  ├─ entity-repository.port.ts
│     │  │  ├─ tag-repository.port.ts
│     │  │  ├─ relation-repository.port.ts
│     │  │  ├─ image-repository.port.ts
│     │  │  └─ image-storage.port.ts
│     │  └─ infra
│     │     ├─ d1
│     │     │  ├─ entity-repository.d1.ts
│     │     │  ├─ tag-repository.d1.ts
│     │     │  ├─ relation-repository.d1.ts
│     │     │  ├─ image-repository.d1.ts
│     │     │  └─ records
│     │     │     ├─ entity.record.ts
│     │     │     ├─ tag.record.ts
│     │     │     └─ image.record.ts
│     │     └─ r2
│     │        └─ image-storage.r2.ts
│     ├─ kind
│     │  ├─ kind.route.ts
│     │  ├─ kind.controller.ts
│     │  └─ application/list-kinds.query.ts
│     └─ tag
│        ├─ tag.route.ts
│        ├─ tag.controller.ts
│        ├─ tag.schema.ts
│        └─ application
│           ├─ create-tag.command.ts
│           └─ delete-tag.command.ts
├─ shared
│  ├─ config
│  │  ├─ env.ts
│  │  └─ bindings.ts
│  ├─ db
│  │  ├─ unit-of-work.ts
│  │  └─ transaction.ts
│  ├─ errors
│  │  ├─ app-error.ts
│  │  └─ error-code.ts
│  ├─ validation
│  │  └─ zod-error-map.ts
│  └─ utils
│     └─ id.ts
└─ tests
   ├─ contract
   ├─ integration
   └─ unit
```

## 3. 命名規約（推奨）

### 3.1 ファイル/ディレクトリ

- ディレクトリは `kebab-case`。
- 役割サフィックスを必須化する。
  - ルーティング: `*.route.ts`
  - HTTP層: `*.controller.ts`, `*.schema.ts`, `*.dto.ts`
  - アプリケーション層: `*.command.ts`, `*.query.ts`
  - ポート: `*.port.ts`
  - 実装アダプタ: `*.d1.ts`, `*.r2.ts`, `*.http.ts`
  - 変換: `*.mapper.ts`
- `models.ts`, `schemas.ts`, `utils.ts` のような汎用名は原則禁止する。

### 3.2 型・クラス・関数

- DB永続化型は `*Record`、API入出力は `*Dto`、ユースケース入力は `*Command` / `*Query`。
- 例:
  - `EntityRow` -> `EntityRecord`
  - `EntityResponseRow` -> `EntityResponseDto`
  - `EntityBody` -> `CreateEntityCommand` または `UpdateEntityCommand`
- クラスを使う場合は「状態を持つアダプタ」に限定する。
  - 例: `D1EntityRepository`, `R2ImageStorage`, `HttpAuthGateway`
- ビジネスロジックは可能な限り副作用の少ない関数として実装する。

## 4. 依存ルール（壊れにくさ優先）

- `route/controller` は `application` のみ呼び出す。
- `application` は `domain` と `ports` のみ参照する。
- `infra` は `ports` を実装するが、`controller` を参照しない。
- 他モジュールの `infra` 実装へ直接依存しない。
- `shared` は横断機能のみ配置し、業務概念は入れない。

## 5. バグ混入を減らすための必須設計ルール

### 5.1 整合性

- 1ユースケース1整合性境界を定義する。
- 複数テーブル更新は `UnitOfWork` 経由で実行する。
- R2とDBの跨り更新は「失敗時の最終状態」を事前定義する。
  - 例: DB優先なら孤立オブジェクトの定期クリーンアップを実装する。

### 5.2 エラー契約

- エラー形式を全APIで統一する。
- 推奨:
  - `ok: false`
  - `error.code`（機械判定用）
  - `error.message`（人間向け）
  - `error.requestId`（追跡用）

### 5.3 検証

- Zodスキーマごとにエラーメッセージを定義し、手動if連鎖を廃止する。
- パース、検証、DTO変換をHTTP層に閉じ込める。

### 5.4 品質ゲート

- `apps/api` に `lint`, `test:unit`, `test:integration`, `test:contract` を追加する。
- ルート・エラー契約・JSON形状を契約テストで固定する。
- import境界ルール（layer/module）を静的検査でCIブロックする。

## 6. 移行ロードマップ（段階的）

1. **Phase 0: 足場**
   - `tests/contract` を先行追加し、現行API契約を固定する。
   - 共通エラー形式と `requestId` を先に導入する。
2. **Phase 1: 入口分割**
   - `index.ts` を `main.ts`, `app/create-app.ts`, `app/middleware/*` に分割する。
   - ルートをモジュール単位へ移す。
3. **Phase 2: カタログ領域再編**
   - `entities/tags/kinds/relations/images` を `modules/catalog/*` へ再配置する。
   - `Row/Body` 型を `Record/Dto/Command` へ改名する。
4. **Phase 3: 整合性強化**
   - `UnitOfWork` 導入。
   - 画像操作の整合性ポリシーを確定し、再試行戦略を実装する。
5. **Phase 4: ルール固定**
   - 命名規約・依存規約をlint/architecture testで強制する。
   - 旧 `usecases`, `repositories`, `domain`, `lib` を廃止する。

## 7. 命名変更の具体例

- `apps/api/src/usecases/entities-usecase.ts`  
  -> `apps/api/src/modules/catalog/entity/application/commands/create-entity.command.ts`  
  -> `apps/api/src/modules/catalog/entity/application/commands/update-entity.command.ts`  
  -> `apps/api/src/modules/catalog/entity/application/queries/list-entities.query.ts`

- `apps/api/src/repositories/entity-repository.ts`  
  -> `apps/api/src/modules/catalog/entity/infra/d1/entity-repository.d1.ts`

- `apps/api/src/domain/models.ts`  
  -> `apps/api/src/modules/catalog/entity/infra/d1/records/entity.record.ts` などへ分割

- `apps/api/src/domain/schemas.ts`  
  -> 各モジュールの `*.schema.ts` に分割

- `apps/api/src/lib/auth-client.ts`  
  -> `apps/api/src/modules/auth/infra/auth-gateway.http.ts`（URLは `shared/config/env.ts` から注入）

## 8. 期待効果

- 変更時の影響範囲が「モジュール + 役割」に限定され、レビューと保守が容易になる。
- 命名が層責務を明示するため、誤った依存や型流用を減らせる。
- 整合性境界とエラー契約を統一することで、障害時の再現・復旧が速くなる。
