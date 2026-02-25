import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const detailPagePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-page-content.tsx"
);
const detailImageGalleryPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-image-gallery.tsx"
);
const detailSummarySectionPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-summary-section.tsx"
);
const detailLocationSectionPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-location-section.tsx"
);
const detailRelatedSectionPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-detail-related-section.tsx"
);
const imagePreviewModalPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/ui/entity-image-preview-modal.tsx"
);
const imagePreviewNavigationPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/detail/model/use-image-preview-navigation.ts"
);
const entityFormFieldsPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-form-fields.tsx"
);
const entityRelatedFieldPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-related-field.tsx"
);
const relatedCardPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/related-entity-card.tsx"
);

describe("entity empty sections", () => {
  it("詳細画面はタグ/画像/関連嗜好が空のとき『なし』文言を表示しない実装になっている", () => {
    const detailSource = fs.readFileSync(detailPagePath, "utf-8");
    const imageGallerySource = fs.readFileSync(detailImageGalleryPath, "utf-8");
    const summarySource = fs.readFileSync(detailSummarySectionPath, "utf-8");
    const locationSource = fs.readFileSync(detailLocationSectionPath, "utf-8");
    const relatedSource = fs.readFileSync(detailRelatedSectionPath, "utf-8");

    expect(detailSource).not.toContain("（タグなし）");
    expect(detailSource).not.toContain("（関連なし）");
    expect(summarySource).not.toContain("（タグなし）");
    expect(relatedSource).not.toContain("（関連なし）");
    expect(imageGallerySource).not.toContain("（画像なし）");
    expect(summarySource).toContain("entity.tags.length > 0 &&");
    expect(locationSource).toContain("緯度:");
    expect(locationSource).toContain("経度:");
    expect(relatedSource).toContain("!relatedLoading && relatedEntities.length === 0");
    expect(detailSource).toContain("<EntityDetailSummarySection");
    expect(detailSource).toContain("<EntityDetailImageGallery");
    expect(detailSource).toContain("<EntityDetailLocationSection");
    expect(detailSource).toContain("<EntityDetailRelatedSection");
    expect(detailSource).toContain("const { data: isAuthenticated } = useAuthStatus();");
    expect(detailSource).toContain("isAuthenticated ? <Button onClick={() => navigate(editPath)}>編集</Button> : undefined");
  });

  it("追加/編集フォームは関連嗜好が空のとき『なし』文言を表示しない実装になっている", () => {
    const formSource = fs.readFileSync(entityFormFieldsPath, "utf-8");
    const relatedSource = fs.readFileSync(entityRelatedFieldPath, "utf-8");

    expect(formSource).toContain("<EntityRelatedField");
    expect(relatedSource).not.toContain("（関連なし）");
    expect(relatedSource).toContain("selectedRelatedEntityIds.length > 0 &&");
    expect(relatedSource).toContain("entity={candidate ?? fallbackEntity}");
    expect(relatedSource).toContain("kind: { id: 0, label: \"未分類\" }");
  });

  it("詳細タグクリックで一覧へ戻り、タグ検索条件をURLへ設定する", () => {
    const pageSource = fs.readFileSync(detailPagePath, "utf-8");
    const summarySource = fs.readFileSync(detailSummarySectionPath, "utf-8");

    expect(pageSource).toContain("const nextSearchParams = new URLSearchParams(location.search);");
    expect(pageSource).toContain("nextSearchParams.set(\"q\", normalizedTagName);");
    expect(pageSource).toContain("nextSearchParams.set(\"fields\", \"tags\");");
    expect(pageSource).toContain("nextSearchParams.set(\"match\", \"exact\");");
    expect(summarySource).toContain("onClick={() => onTagClick(tag.name)}");
  });

  it("画像プレビューの左右矢印は押せる方向のみ表示する実装になっている", () => {
    const previewModalSource = fs.readFileSync(imagePreviewModalPath, "utf-8");
    const previewNavigationSource = fs.readFileSync(imagePreviewNavigationPath, "utf-8");

    expect(previewModalSource).toContain("{canMoveToPreviousImage && (");
    expect(previewModalSource).toContain("{canMoveToNextImage && (");
    expect(previewModalSource).toContain("onPointerUp={onSwitchByPreviewAreaPointer}");
    expect(previewNavigationSource).toContain("if (event.key === \"ArrowLeft\")");
    expect(previewNavigationSource).toContain("if (event.key === \"ArrowRight\")");
  });

  it("関連嗜好カードはトップカード準拠の要素を描画し、詳細のみクリック遷移を持てる", () => {
    const relatedCardSource = fs.readFileSync(relatedCardPath, "utf-8");
    const detailRelatedSource = fs.readFileSync(detailRelatedSectionPath, "utf-8");
    const relatedFieldSource = fs.readFileSync(entityRelatedFieldPath, "utf-8");

    expect(relatedCardSource).toContain("entity: Pick<Entity,");
    expect(relatedCardSource).toContain("entity.isWishlist ? (");
    expect(relatedCardSource).toContain("気になる項目");
    expect(relatedCardSource).toContain("entity.description && (");
    expect(relatedCardSource).toContain("entity.tags.length > 0 &&");
    expect(relatedCardSource).toContain("role=\"link\"");
    expect(relatedCardSource).toContain("if (!interactive || !onSelect)");
    expect(detailRelatedSource).toContain("interactive");
    expect(detailRelatedSource).toContain("onSelect={() => onSelectRelatedEntity(relatedEntity.id)}");
    expect(relatedFieldSource).not.toContain("interactive");
  });
});
