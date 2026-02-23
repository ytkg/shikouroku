import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEntityDetailPage } from "../model/use-entity-detail-page";
import {
  getEntityDetailPath,
  getEntityEditPath,
  routePaths
} from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function EntityDetailPageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const page = useEntityDetailPage(entityId);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isImageListScrolled, setIsImageListScrolled] = useState(false);
  const imageListRef = useRef<HTMLDivElement | null>(null);
  const editPath = entityId ? getEntityEditPath(entityId) : routePaths.home;
  const listPath = location.search.length > 0 ? `${routePaths.home}${location.search}` : routePaths.home;
  const selectedImage = page.images.find((image) => image.id === selectedImageId) ?? null;
  const selectedImageIndex = selectedImage
    ? page.images.findIndex((image) => image.id === selectedImage.id)
    : -1;
  const canMoveToPreviousImage = selectedImageIndex > 0;
  const canMoveToNextImage =
    selectedImageIndex >= 0 && selectedImageIndex < page.images.length - 1;

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

  const showPreviousImage = useCallback(() => {
    if (!canMoveToPreviousImage) {
      return;
    }

    const previousImage = page.images[selectedImageIndex - 1];
    if (!previousImage) {
      return;
    }

    setSelectedImageId(previousImage.id);
  }, [canMoveToPreviousImage, page.images, selectedImageIndex]);

  const showNextImage = useCallback(() => {
    if (!canMoveToNextImage) {
      return;
    }

    const nextImage = page.images[selectedImageIndex + 1];
    if (!nextImage) {
      return;
    }

    setSelectedImageId(nextImage.id);
  }, [canMoveToNextImage, page.images, selectedImageIndex]);

  const switchImageByPreviewAreaPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const previewRect = event.currentTarget.getBoundingClientRect();
      const isLeftSide = event.clientX < previewRect.left + previewRect.width / 2;
      if (isLeftSide) {
        showPreviousImage();
        return;
      }

      showNextImage();
    },
    [showNextImage, showPreviousImage]
  );

  useEffect(() => {
    if (!selectedImageId) {
      return;
    }

    if (page.images.some((image) => image.id === selectedImageId)) {
      return;
    }

    setSelectedImageId(null);
  }, [page.images, selectedImageId]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImageId(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
        return;
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedImage, showPreviousImage, showNextImage]);

  useEffect(() => {
    const imageList = imageListRef.current;
    if (!imageList) {
      setIsImageListScrolled(false);
      return;
    }

    setIsImageListScrolled(imageList.scrollLeft > 2);
  }, [page.images]);

  if (entityId && page.isLoading) {
    return <main className="w-full bg-background pt-20" />;
  }

  const kindLabel = page.entity?.kind.label ?? "不明";

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-20">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{page.entity?.name ?? "嗜好 詳細"}</CardTitle>
            <CardDescription>{page.entity?.isWishlist ? "気になるに登録済み" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {page.error ? (
              <p className="text-sm text-destructive">{page.error}</p>
            ) : (
              page.entity && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p className="break-all text-xs">{page.entity.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">種別</p>
                    <p className="text-sm">{kindLabel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">メモ</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {page.entity.description && page.entity.description.length > 0
                        ? page.entity.description
                        : "（メモなし）"}
                    </p>
                  </div>
                  {page.entity.tags.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">タグ</p>
                      <div className="flex flex-wrap gap-2">
                        {page.entity.tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            className="rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                            onClick={() => moveToListWithTagFilter(tag.name)}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(page.imagesLoading || page.images.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">画像</p>
                      {page.imagesLoading ? (
                        <p className="text-sm">読み込み中...</p>
                      ) : (
                        <div className="relative">
                          <div
                            ref={imageListRef}
                            className="grid grid-flow-col auto-cols-[calc((100%-2rem)/4.5)] gap-2 overflow-x-auto pb-1"
                            onScroll={(event) => {
                              setIsImageListScrolled(event.currentTarget.scrollLeft > 2);
                            }}
                          >
                            {page.images.map((image) => (
                              <button
                                key={image.id}
                                type="button"
                                className="block rounded-md border p-1"
                                onClick={() => setSelectedImageId(image.id)}
                              >
                                <img
                                  src={image.url}
                                  alt={image.fileName}
                                  className="aspect-square w-full rounded object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                          {page.images.length > 4 && (
                            <>
                              {isImageListScrolled && (
                                <div
                                  className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background/80 via-background/40 to-transparent"
                                  aria-hidden="true"
                                />
                              )}
                              <div
                                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background/80 via-background/40 to-transparent"
                                aria-hidden="true"
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {(page.relatedLoading || page.relatedEntities.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">関連嗜好</p>
                      {page.relatedLoading ? (
                        <p className="text-sm">読み込み中...</p>
                      ) : (
                        <div className="space-y-2">
                          {page.relatedEntities.map((relatedEntity) => (
                            <div key={relatedEntity.id} className="rounded-md border px-3 py-2">
                              <button
                                type="button"
                                className="text-left text-sm hover:underline"
                                onClick={() =>
                                  navigate({
                                    pathname: getEntityDetailPath(relatedEntity.id),
                                    search: location.search
                                  })
                                }
                              >
                                {relatedEntity.name}（{relatedEntity.kind.label}）
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={() => navigate(editPath)}>編集</Button>
          </CardFooter>
        </Card>
        <Button variant="outline" onClick={() => navigate(listPath)}>
          一覧へ戻る
        </Button>
      </main>
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedImageId(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="画像プレビュー"
        >
          <div className="w-full max-w-4xl rounded-lg border bg-background p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedImageId(null)}>
                閉じる
              </Button>
            </div>
            <div className="relative flex justify-center" onPointerUp={switchImageByPreviewAreaPointer}>
              <img
                src={selectedImage.url}
                alt={selectedImage.fileName}
                className="max-h-[80vh] w-auto max-w-full rounded object-contain"
              />
              {canMoveToPreviousImage && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-3xl text-white/50"
                  aria-hidden="true"
                >
                  ←
                </div>
              )}
              {canMoveToNextImage && (
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-3xl text-white/50"
                  aria-hidden="true"
                >
                  →
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
