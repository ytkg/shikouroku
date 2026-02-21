# 嗜好関連（関連嗜好）機能 仕様 v1

対象: `apps/web` / `apps/api`

この文書でいう「嗜好関連」機能は、
**ある嗜好に対して、関連する別の嗜好を紐づけて相互表示する機能**を指す。

例:
- 嗜好A: `タナニボ`（ラーメン）
- 嗜好B: `たなか青空笑店`（ラーメン屋）
- AにBを関連付けると、BにもAが関連として表示される（無向）。

## 1. 目的

- 嗜好単体ではなく、嗜好同士のつながりを記録・参照できるようにする。
- 「商品 ↔ 店」「料理 ↔ 店」「作品 ↔ 作者」など、跨る文脈を1ステップで辿れるようにする。

## 2. ユースケース

1. 詳細画面で、その嗜好に関連する嗜好一覧を見たい。
2. 詳細画面から、別の嗜好を関連として追加したい。
3. 誤って付けた関連を解除したい。
4. 追加した関連が相手側の詳細にも表示されてほしい（無向の担保）。

## 3. V1スコープ

- 対象画面は `嗜好詳細` `嗜好新規登録` `嗜好編集` とする。
- 一覧画面の仕様（タブ/フィルタ）は変更しない。
- 認証要件は既存APIと同様（`/api/login` 以外は認証必須）。
- 関連追加候補の取得は、既存 `GET /api/entities`（最大50件）を利用する。
- 関連候補は種別跨ぎで表示し、同種別優先などの並べ替えはV1では行わない。
- 関連一覧の表示順は作成日時順（新しい関連を先頭）とする。
- 1嗜好あたりの関連数上限は設けない。

## 4. 画面仕様

### 4.1 詳細画面: 関連嗜好セクション

- 見出し: `関連嗜好`
- 表示内容
  - 嗜好名
  - 種別ラベル
- 各関連嗜好はクリックで詳細に遷移できる。
- 0件時は空状態メッセージを表示。

### 4.2 追加操作（詳細画面内）

- `関連を追加` ボタンでダイアログを開く。
- 候補から1件選んで追加する。
- 追加成功後、現在詳細の関連一覧に即時反映。

### 4.3 解除操作（詳細画面内）

- 各関連嗜好に `解除` 操作を表示。
- 解除成功後、一覧から即時消える。

### 4.4 新規登録画面: 関連嗜好選択

- 登録時に関連付けたい嗜好を複数選択できる。
- 嗜好登録成功後、選択した関連が新規嗜好へ付与される。

### 4.5 編集画面: 関連嗜好編集

- 既存の関連嗜好をチェック状態で表示する。
- 保存時に選択との差分で関連を追加・解除する。

## 5. API仕様

### 5.1 取得

- `GET /api/entities/:id/related`
- 返却順: 関連作成日時の降順
- レスポンス例

```json
{
  "ok": true,
  "related": [
    {
      "id": "...",
      "kind": { "id": 1, "label": "ラーメン屋" },
      "name": "たなか青空笑店",
      "description": null,
      "is_wishlist": 0,
      "tags": []
    }
  ]
}
```

### 5.2 追加

- `POST /api/entities/:id/related`
- body: `{ "relatedEntityId": "..." }`
- 正常: `201` で `{ ok: true }`

### 5.3 解除

- `DELETE /api/entities/:id/related/:relatedEntityId`
- 正常: `200` で `{ ok: true }`

### 5.4 エラー（V1実装）

- `400`: 自己関連（`id === relatedEntityId`）など不正入力
- `404`: どちらかの嗜好が存在しない
- `409`: 既に同じ関連が存在
- `401`: 未認証

## 6. データモデル（V1実装）

新規テーブル `entity_relations` を追加する。

```sql
CREATE TABLE IF NOT EXISTS entity_relations (
  entity_id_low TEXT NOT NULL,
  entity_id_high TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_id_low, entity_id_high),
  CHECK (entity_id_low <> entity_id_high),
  FOREIGN KEY (entity_id_low) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id_high) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entity_relations_low ON entity_relations(entity_id_low);
CREATE INDEX IF NOT EXISTS idx_entity_relations_high ON entity_relations(entity_id_high);
```

保存時は `(a, b)` を文字列比較で正規化し、
`(min(a,b), max(a,b))` で保持する（無向を一意に担保）。

## 7. 業務ルール

- 関連は無向。
- 自己関連は禁止。
- 重複関連は禁止。
- 追加時は両IDの存在チェックを行う。
- 候補表示では「自分自身」「すでに関連済み」を除外する。
- 1嗜好あたりの関連数上限は設けない。

## 8. 実装方針（フロント）

- `entities/entity/api` に関連嗜好APIクライアントを追加。
- `entities/entity/model` に関連嗜好用の query/mutation を追加。
- `features/entities/detail` で関連嗜好の表示・追加・解除UIを扱う。
- 既存の `resolveQueryError` / 認証ガードを再利用する。
- 候補選択ダイアログの初期データは `GET /api/entities` の結果を利用し、検索APIはV1対象外とする。

## 9. 受け入れ条件

1. AでBを関連追加すると、A詳細とB詳細の双方に相手が表示される。
2. AでBを解除すると、A詳細とB詳細の双方から消える。
3. 同じ関連を二重追加できない（409）。
4. 自己関連は追加できない（400）。
5. 未認証時は既存仕様どおりログインへ遷移する。

## 10. 壁打ちしたい論点（要決定）

現時点で未決論点なし。

## 11. 実装状況（2026-02-21）

- 完了: `entity_relations` テーブルとインデックスを migration に追加。
- 完了: 関連取得/追加/解除 API（`GET/POST/DELETE /api/entities/:id/related*`）を追加。
- 完了: 詳細画面に関連嗜好セクション、追加ダイアログ、解除操作を追加。
- 完了: 新規登録画面/編集画面で関連嗜好を選択・保存できるようにした。
- 完了: 関連APIレスポンスのパーサー/クライアントとSWR query/mutationを追加。
- 完了: 関連機能のユニットテスト（API path, parser, client）を追加。
