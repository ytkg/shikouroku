import type { Entity, EntityImage, Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { ModalShell } from "@/shared/ui/modal-shell";
import { Skeleton } from "@/shared/ui/skeleton";
import type { EntityLocationMapData } from "./entity-map.types";

type EntityMapDetailModalProps = {
  selectedEntity: Entity | undefined;
  selectedEntityImages: EntityImage[];
  selectedEntityId: string | null;
  selectedLocation: EntityLocationMapData | null;
  isSelectedEntityLoading: boolean;
  isSelectedEntityImagesLoading: boolean;
  onClose: () => void;
  onTagClick: (tag: Tag) => void;
};

export function EntityMapDetailModal({
  selectedEntity,
  selectedEntityImages,
  selectedEntityId,
  selectedLocation,
  isSelectedEntityLoading,
  isSelectedEntityImagesLoading,
  onClose,
  onTagClick
}: EntityMapDetailModalProps) {
  const displayName = selectedEntity?.name ?? selectedLocation?.name ?? "";
  const displayKindLabel = selectedEntity?.kind.label ?? selectedLocation?.kind.label ?? "";
  const displayDescription = selectedEntity?.description ?? null;
  const displayTags = selectedEntity?.tags ?? selectedLocation?.tags ?? [];

  return (
    <ModalShell
      open={selectedEntityId !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      ariaLabel="嗜好の詳細"
      contentClassName="max-w-lg"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">嗜好の詳細</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </div>

        {isSelectedEntityLoading && (
          <div className="space-y-3" aria-hidden="true">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        )}

        {!isSelectedEntityLoading && selectedLocation && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">名前</p>
              <p>{displayName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">種別</p>
              <p>{displayKindLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">説明</p>
              <p>{displayDescription && displayDescription.length > 0 ? displayDescription : "未設定"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">タグ</p>
              {displayTags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {displayTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                      onClick={() => onTagClick(tag)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p>なし</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">画像</p>
              {isSelectedEntityImagesLoading ? (
                <Skeleton className="mt-1 h-40 w-full" />
              ) : selectedEntityImages.length > 0 ? (
                <div className="mt-1 space-y-2">
                  <img
                    src={selectedEntityImages[0]?.url}
                    alt={selectedEntityImages[0]?.fileName ?? `${displayName} の画像`}
                    className="h-40 w-full rounded-md border object-cover"
                  />
                  <p className="text-xs text-muted-foreground">全 {selectedEntityImages.length} 枚</p>
                </div>
              ) : (
                <p>なし</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
