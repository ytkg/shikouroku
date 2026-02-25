import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthStatus } from "@/features/auth";
import { useEntityDetailPage } from "../model/use-entity-detail-page";
import { useImagePreviewNavigation } from "../model/use-image-preview-navigation";
import { EntityDetailImageGallery } from "./entity-detail-image-gallery";
import { EntityDetailLocationSection } from "./entity-detail-location-section";
import { EntityDetailPageSkeleton } from "./entity-detail-page-skeleton";
import { EntityImagePreviewModal } from "./entity-image-preview-modal";
import { EntityDetailRelatedSection } from "./entity-detail-related-section";
import { EntityDetailSummarySection } from "./entity-detail-summary-section";
import { EntityPageActionRow } from "../../shared/ui/entity-page-action-row";
import {
  getEntityDetailPath,
  getEntityEditPath,
  routePaths
} from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { useSeo } from "@/shared/lib/seo";

export function EntityDetailPageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const { data: isAuthenticated } = useAuthStatus();
  const page = useEntityDetailPage(entityId);
  const imagePreview = useImagePreviewNavigation(page.images);
  const editPath = entityId ? getEntityEditPath(entityId) : routePaths.home;
  const listPath = location.search.length > 0 ? `${routePaths.home}${location.search}` : routePaths.home;
  const entityTitle = page.entity ? `${page.entity.name} (${page.entity.kind.label})` : "嗜好の詳細";
  const entityDescription = page.entity?.description?.trim()
    ? page.entity.description.trim()
    : "登録された嗜好の詳細情報を確認できます。";

  useSeo({
    title: entityTitle,
    description: entityDescription,
    path: location.pathname,
    ogType: "article",
    jsonLd: page.entity
      ? {
          "@context": "https://schema.org",
          "@type": "Thing",
          name: page.entity.name,
          description: entityDescription,
          keywords: page.entity.tags.map((tag) => tag.name).join(", "),
          additionalType: page.entity.kind.label,
          url: new URL(location.pathname, window.location.origin).toString(),
          ...(page.entity.location
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: page.entity.location.latitude,
                  longitude: page.entity.location.longitude
                }
              }
            : {})
        }
      : undefined
  });

  const moveToListWithTagFilter = (tagName: string) => {
    const normalizedTagName = tagName.trim();
    if (normalizedTagName.length === 0) {
      navigate(routePaths.home);
      return;
    }

    const nextSearchParams = new URLSearchParams(location.search);
    nextSearchParams.set("q", normalizedTagName);
    nextSearchParams.set("fields", "tags");
    nextSearchParams.set("match", "exact");
    const nextSearch = nextSearchParams.toString();

    navigate({
      pathname: routePaths.home,
      search: nextSearch.length > 0 ? `?${nextSearch}` : ""
    });
  };

  const moveToRelatedEntityDetail = (relatedEntityId: string) => {
    navigate({
      pathname: getEntityDetailPath(relatedEntityId),
      search: location.search
    });
  };

  if (entityId && page.isLoading) {
    return <EntityDetailPageSkeleton />;
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-16">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{page.entity?.name ?? "嗜好 詳細"}</CardTitle>
              {page.entity?.isWishlist && (
                <span className="ui-pill">気になる</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {page.error ? (
              <p className="text-sm text-destructive">{page.error}</p>
            ) : (
              page.entity && (
                <>
                  <EntityDetailSummarySection
                    entity={page.entity}
                    onTagClick={moveToListWithTagFilter}
                  />
                  <EntityDetailImageGallery
                    images={page.images}
                    imagesLoading={page.imagesLoading}
                    onSelectImage={imagePreview.openPreview}
                  />
                  {page.entity.location && (
                    <EntityDetailLocationSection
                      latitude={page.entity.location.latitude}
                      longitude={page.entity.location.longitude}
                    />
                  )}
                  <EntityDetailRelatedSection
                    relatedLoading={page.relatedLoading}
                    relatedEntities={page.relatedEntities}
                    onSelectRelatedEntity={moveToRelatedEntityDetail}
                  />
                </>
              )
            )}
          </CardContent>
        </Card>
        <EntityPageActionRow
          leftAction={
            <Button variant="outline" onClick={() => navigate(listPath)}>
              一覧へ戻る
            </Button>
          }
          rightAction={
            isAuthenticated ? <Button onClick={() => navigate(editPath)}>編集</Button> : undefined
          }
        />
      </main>
      <EntityImagePreviewModal
        selectedImage={imagePreview.selectedImage}
        canMoveToPreviousImage={imagePreview.canMoveToPreviousImage}
        canMoveToNextImage={imagePreview.canMoveToNextImage}
        onClose={imagePreview.closePreview}
        onSwitchByPreviewAreaPointer={imagePreview.switchImageByPreviewAreaPointer}
      />
    </>
  );
}
