import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dialogStatePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/manage-tags/model/use-tag-edit-dialog-state.ts"
);
const dialogViewPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/manage-tags/ui/tag-edit-dialog-view.tsx"
);
const tagListEditorPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/manage-tags/ui/tag-list-editor.tsx"
);

describe("tag edit dialog search", () => {
  it("ダイアログクローズ時を含めて open 変化時に検索文字列をリセットする", () => {
    const source = fs.readFileSync(dialogStatePath, "utf-8");

    expect(source).toContain("const [query, setQuery] = useState(\"\");");
    expect(source).toContain("setQuery(\"\");");
    expect(source).toContain("}, [open]);");
  });

  it("ダイアログに検索入力を表示し、TagListEditorへ query を渡す", () => {
    const source = fs.readFileSync(dialogViewPath, "utf-8");

    expect(source).toContain("placeholder=\"タグを検索\"");
    expect(source).toContain("aria-label=\"タグを検索\"");
    expect(source).toContain("<TagListEditor");
    expect(source).toContain("query={query}");
  });

  it("TagListEditorは部分一致・case-insensitive検索と安定ソートを適用する", () => {
    const source = fs.readFileSync(tagListEditorPath, "utf-8");

    expect(source).toContain("left.name.localeCompare(right.name, \"ja\")");
    expect(source).toContain("return left.id - right.id;");
    expect(source).toContain("query.trim().toLocaleLowerCase()");
    expect(source).toContain("tag.name.toLocaleLowerCase().includes(normalizedQuery)");
    expect(source).toContain("該当するタグがありません。");
  });
});
