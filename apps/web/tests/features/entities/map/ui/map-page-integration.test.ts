import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.resolve(currentDir, "../../../../../src/features/entities/map/ui/entity-map-page-content.tsx");

describe("map page integration", () => {
  it("タグと名前検索の複合フィルタで表示対象を絞り込む", () => {
    const source = fs.readFileSync(pagePath, "utf-8");

    expect(source).toContain("const [selectedTagId, setSelectedTagId] = useState<string>(\"all\");");
    expect(source).toContain("const [nameQuery, setNameQuery] = useState(\"\");");
    expect(source).toContain("if (selectedTagId !== \"all\" && !entity.tags.some((tag) => String(tag.id) === selectedTagId))");
    expect(source).toContain("if (normalizedQuery.length > 0 && !entity.name.toLocaleLowerCase().includes(normalizedQuery))");
    expect(source).toContain("<span className=\"text-muted-foreground\">タグ</span>");
    expect(source).toContain("<span className=\"text-muted-foreground\">名前検索</span>");
  });

  it("一覧・マーカー・モーダル詳細の連携を持ち、モーダルを閉じられる", () => {
    const source = fs.readFileSync(pagePath, "utf-8");

    expect(source).toContain("marker.on(\"click\", () => {");
    expect(source).toContain("setSelectedEntityId(entity.id);");
    expect(source).toContain("open={selectedEntityId !== null}");
    expect(source).toContain("ariaLabel=\"嗜好の詳細\"");
    expect(source).toContain("onOpenChange={(open) => {");
    expect(source).toContain("if (!open) {");
    expect(source).toContain("setSelectedEntityId(null);");
    expect(source).toContain("閉じる");
  });

  it("モーダル内タグクリックでタグ再絞り込みし、名前検索をクリアしてモーダルを閉じる", () => {
    const source = fs.readFileSync(pagePath, "utf-8");

    expect(source).toContain("setSelectedTagId(String(tag.id));");
    expect(source).toContain("setNameQuery(\"\");");
    expect(source).toContain("setSelectedEntityId(null);");
  });
});
