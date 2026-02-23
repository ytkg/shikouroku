import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const editFormPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/edit/model/use-edit-entity-form.ts"
);
const imageEditorFieldPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-image-editor-field.tsx"
);

describe("edit entity image reorder", () => {
  it("画像順序は未保存状態を保持し、保存時のみ順序APIを呼び出す", () => {
    const source = fs.readFileSync(editFormPath, "utf-8");

    expect(source).toContain(
      "const [pendingImageOrderIds, setPendingImageOrderIds] = useState<string[] | null>(null);"
    );
    expect(source).toContain("if (pendingImageOrderIds) {");
    expect(source).toContain("await reorderEntityImages(entityId, {");

    const reorderCallCount = source.match(/reorderEntityImages\(entityId/g)?.length ?? 0;
    expect(reorderCallCount).toBe(1);
  });

  it("画像編集UIはカード全体ドラッグの D&D と上下ボタンを併用する", () => {
    const source = fs.readFileSync(imageEditorFieldPath, "utf-8");

    expect(source).toContain("@dnd-kit/core");
    expect(source).toContain("@dnd-kit/sortable");
    expect(source).toContain("useSortable({");
    expect(source).toContain("<DndContext");
    expect(source).toContain("<SortableContext");
    expect(source).toContain("onReorderImages(String(active.id), String(over.id));");
    expect(source).toContain("上へ");
    expect(source).toContain("下へ");
  });
});
