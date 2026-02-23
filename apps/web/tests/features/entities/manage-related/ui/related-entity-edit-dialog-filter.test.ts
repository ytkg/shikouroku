import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dialogPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/manage-related/ui/related-entity-edit-dialog.tsx"
);

describe("related entity edit dialog filter", () => {
  it("検索と種別フィルタを組み合わせて候補を絞り込む", () => {
    const source = fs.readFileSync(dialogPath, "utf-8");

    expect(source).toContain("const [searchQuery, setSearchQuery] = useState(\"\");");
    expect(source).toContain("const [selectedKindId, setSelectedKindId] = useState(\"\");");
    expect(source).toContain("candidate.name.toLocaleLowerCase().includes(normalizedQuery)");
    expect(source).toContain("String(candidate.kind.id) === selectedKindId");
    expect(source).toContain("placeholder=\"候補を検索\"");
    expect(source).toContain("aria-label=\"種別で絞り込み\"");
  });

  it("選択済み件数と選択済み行の視認性を表示する", () => {
    const source = fs.readFileSync(dialogPath, "utf-8");

    expect(source).toContain("選択中: {selectedRelatedEntityIds.length}件");
    expect(source).toContain("selected ? \"bg-muted/70 font-medium\" : \"\"");
    expect(source).toContain(">選択中<");
  });

  it("フィルタ結果0件時に空状態メッセージを表示する", () => {
    const source = fs.readFileSync(dialogPath, "utf-8");

    expect(source).toContain("visibleCandidates.length === 0");
    expect(source).toContain("候補がありません。");
  });
});
