import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const createPagePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/create/ui/create-entity-page-content.tsx"
);
const editPagePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/edit/ui/edit-entity-page-content.tsx"
);
const detailPagePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-page-content.tsx"
);
const detailSkeletonPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-page-skeleton.tsx"
);
const formSkeletonPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-form-page-skeleton.tsx"
);
const sharedSkeletonPath = path.resolve(
  currentDir,
  "../../../../../src/shared/ui/skeleton.tsx"
);

describe("entity page loading skeleton", () => {
  it("詳細・作成・編集ページは空白mainではなくスケルトンを返す", () => {
    const detailSource = fs.readFileSync(detailPagePath, "utf-8");
    const createSource = fs.readFileSync(createPagePath, "utf-8");
    const editSource = fs.readFileSync(editPagePath, "utf-8");

    expect(detailSource).toContain("if (entityId && page.isLoading)");
    expect(detailSource).toContain("return <EntityDetailPageSkeleton />;");
    expect(createSource).toContain("if (form.loading)");
    expect(createSource).toContain("return <EntityFormPageSkeleton />;");
    expect(editSource).toContain("if (form.loading)");
    expect(editSource).toContain("return <EntityFormPageSkeleton />;");
    expect(detailSource).not.toContain("return <main className=\"w-full bg-background pt-20\" />;");
    expect(createSource).not.toContain("return <main className=\"w-full bg-background pt-20\" />;");
    expect(editSource).not.toContain("return <main className=\"w-full bg-background pt-20\" />;");
  });

  it("スケルトンは既存カードレイアウトを維持し、animate-pulseで表示する", () => {
    const detailSkeletonSource = fs.readFileSync(detailSkeletonPath, "utf-8");
    const formSkeletonSource = fs.readFileSync(formSkeletonPath, "utf-8");
    const sharedSkeletonSource = fs.readFileSync(sharedSkeletonPath, "utf-8");

    expect(detailSkeletonSource).toContain("mx-auto flex w-full max-w-3xl");
    expect(formSkeletonSource).toContain("mx-auto flex w-full max-w-3xl");
    expect(sharedSkeletonSource).toContain("animate-pulse");
    expect(sharedSkeletonSource).toContain("bg-muted");
  });
});
