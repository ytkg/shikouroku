import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const tagFieldPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-tag-field.tsx"
);
const formFieldsPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-form-fields.tsx"
);

describe("edit label clickability", () => {
  it("タグラベルは共通の選択ラベルコンポーネントを使う", () => {
    const source = fs.readFileSync(tagFieldPath, "utf-8");

    expect(source).toContain("SelectablePillCheckbox");
    expect(source).toContain("onCheckedChange={(checked) => onToggleTag(tag.id, checked)}");
  });

  it("気になるラベルは共通の選択ラベルコンポーネントを使う", () => {
    const source = fs.readFileSync(formFieldsPath, "utf-8");

    expect(source).toContain("<SelectablePillCheckbox");
    expect(source).toContain("className=\"w-fit\"");
    expect(source).toContain("気になる");
  });
});
