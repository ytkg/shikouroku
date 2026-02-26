import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.resolve(currentDir, "../../../../../src/features/entities/map/ui/entity-map-page-content.tsx");
const filterModelPath = path.resolve(currentDir, "../../../../../src/features/entities/map/model/use-entity-map-filter.ts");
const mapModelPath = path.resolve(currentDir, "../../../../../src/features/entities/map/model/use-leaflet-entity-map.ts");
const modalPath = path.resolve(currentDir, "../../../../../src/features/entities/map/ui/entity-map-detail-modal.tsx");

describe("map page integration", () => {
  it("タグと名前検索の複合フィルタで表示対象を絞り込む", () => {
    const source = fs.readFileSync(filterModelPath, "utf-8");

    expect(source).toContain("if (selectedTagId !== \"all\" && !entity.tags.some((tag) => String(tag.id) === selectedTagId))");
    expect(source).toContain("if (normalizedQuery.length > 0 && !entity.name.toLocaleLowerCase().includes(normalizedQuery))");
  });

  it("一覧・マーカー・モーダル詳細の連携を持ち、モーダルを閉じられる", () => {
    const pageSource = fs.readFileSync(pagePath, "utf-8");
    const mapSource = fs.readFileSync(mapModelPath, "utf-8");
    const modalSource = fs.readFileSync(modalPath, "utf-8");

    expect(mapSource).toContain("marker.on(\"click\", () => {");
    expect(mapSource).toContain("onMarkerClick(entity.id);");
    expect(pageSource).toContain("onMarkerClick: setSelectedEntityId");
    expect(modalSource).toContain("open={selectedEntityId !== null}");
    expect(modalSource).toContain("ariaLabel=\"嗜好の詳細\"");
    expect(modalSource).toContain("onOpenChange={(open) => {");
    expect(modalSource).toContain("if (!open) {");
    expect(modalSource).toContain("onClose();");
    expect(modalSource).toContain("閉じる");
  });

  it("モーダル内タグクリックでタグ再絞り込みし、名前検索をクリアしてモーダルを閉じる", () => {
    const source = fs.readFileSync(pagePath, "utf-8");

    expect(source).toContain("setSelectedTagId(String(tagId));");
    expect(source).toContain("setNameQuery(\"\");");
    expect(source).toContain("setSelectedEntityId(null);");
  });
});
