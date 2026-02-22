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
  it("詳細画面はタグ/関連嗜好が空のとき『なし』文言を表示しない実装になっている", () => {
    const source = fs.readFileSync(detailPagePath, "utf-8");

    expect(source).not.toContain("（タグなし）");
    expect(source).not.toContain("（関連なし）");
    expect(source).toContain("page.entity.tags.length > 0 &&");
    expect(source).toContain("(page.relatedLoading || page.relatedEntities.length > 0) &&");
  });

  it("追加/編集フォームは関連嗜好が空のとき『なし』文言を表示しない実装になっている", () => {
    const source = fs.readFileSync(entityFormFieldsPath, "utf-8");

    expect(source).not.toContain("（関連なし）");
    expect(source).toContain("selectedRelatedEntityIdsSafe.length > 0 &&");
  });
});
