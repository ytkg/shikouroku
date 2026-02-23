import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const detailPagePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-page-content.tsx"
);
const entityFormFieldsPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-form-fields.tsx"
);

describe("entity empty sections", () => {
  it("詳細画面はタグ/画像/関連嗜好が空のとき『なし』文言を表示しない実装になっている", () => {
    const source = fs.readFileSync(detailPagePath, "utf-8");

    expect(source).not.toContain("（タグなし）");
    expect(source).not.toContain("（画像なし）");
    expect(source).not.toContain("（関連なし）");
    expect(source).toContain("page.entity.tags.length > 0 &&");
    expect(source).toContain("(page.imagesLoading || page.images.length > 0) &&");
    expect(source).toContain("(page.relatedLoading || page.relatedEntities.length > 0) &&");
  });

  it("追加/編集フォームは関連嗜好が空のとき『なし』文言を表示しない実装になっている", () => {
    const source = fs.readFileSync(entityFormFieldsPath, "utf-8");

    expect(source).not.toContain("（関連なし）");
    expect(source).toContain("selectedRelatedEntityIdsSafe.length > 0 &&");
  });

  it("詳細タグクリックで一覧へ戻り、タグ検索条件をURLへ設定する", () => {
    const source = fs.readFileSync(detailPagePath, "utf-8");

    expect(source).toContain("const nextSearchParams = new URLSearchParams(location.search);");
    expect(source).toContain("nextSearchParams.set(\"q\", normalizedTagName);");
    expect(source).toContain("nextSearchParams.set(\"fields\", \"tags\");");
    expect(source).toContain("nextSearchParams.set(\"match\", \"exact\");");
    expect(source).toContain("onClick={() => moveToListWithTagFilter(tag.name)}");
  });

  it("画像プレビューの左右矢印は押せる方向のみ表示する実装になっている", () => {
    const source = fs.readFileSync(detailPagePath, "utf-8");

    expect(source).toContain("{canMoveToPreviousImage && (");
    expect(source).toContain("{canMoveToNextImage && (");
    expect(source).toContain("onPointerUp={switchImageByPreviewAreaPointer}");
  });
});
