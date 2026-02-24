import type { EntityImage } from "@/entities/entity";
import { DndContext, type DragEndEvent, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toFileSizeLabel } from "@/shared/lib/to-file-size-label";

type EntityImageEditorFieldProps = {
  images: EntityImage[];
  failedImageFilesCount: number;
  uploadingImages: boolean;
  reorderingImages: boolean;
  deletingImageIds: string[];
  onSelectImageFiles: (files: FileList | null) => Promise<void>;
  onRetryFailedImageUploads: () => Promise<void>;
  onMoveImageUp: (imageId: string) => void;
  onMoveImageDown: (imageId: string) => void;
  onReorderImages: (activeImageId: string, overImageId: string) => void;
  onDeleteImage: (imageId: string) => Promise<void>;
};

type SortableImageCardProps = {
  image: EntityImage;
  index: number;
  total: number;
  reorderingImages: boolean;
  deletingImageIds: string[];
  onMoveImageUp: (imageId: string) => void;
  onMoveImageDown: (imageId: string) => void;
  onDeleteImage: (imageId: string) => Promise<void>;
};

function SortableImageCard({
  image,
  index,
  total,
  reorderingImages,
  deletingImageIds,
  onMoveImageUp,
  onMoveImageDown,
  onDeleteImage
}: SortableImageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled: reorderingImages
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none"
      }}
      className={`rounded-lg border border-border/70 bg-card/85 p-3 ${isDragging ? "opacity-70" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <img src={image.url} alt={image.fileName} className="h-20 w-20 rounded-md object-cover" loading="lazy" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="ui-body-text truncate font-medium">{image.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {image.mimeType} / {toFileSizeLabel(image.fileSize)}
          </p>
          <p className="text-xs text-muted-foreground">表示順: {index + 1}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={index === 0 || reorderingImages}
          onClick={() => onMoveImageUp(image.id)}
        >
          上へ
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={index === total - 1 || reorderingImages}
          onClick={() => onMoveImageDown(image.id)}
        >
          下へ
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={deletingImageIds.includes(image.id)}
          onClick={() => void onDeleteImage(image.id)}
        >
          {deletingImageIds.includes(image.id) ? "削除中..." : "削除"}
        </Button>
      </div>
    </div>
  );
}

export function EntityImageEditorField({
  images,
  failedImageFilesCount,
  uploadingImages,
  reorderingImages,
  deletingImageIds,
  onSelectImageFiles,
  onRetryFailedImageUploads,
  onMoveImageUp,
  onMoveImageDown,
  onReorderImages,
  onDeleteImage
}: EntityImageEditorFieldProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 8
      }
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    onReorderImages(String(active.id), String(over.id));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="entity-images-edit">画像</Label>
      <Input
        id="entity-images-edit"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          void onSelectImageFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {uploadingImages && <p className="text-sm text-muted-foreground">画像をアップロード中...</p>}
      {failedImageFilesCount > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
          <p className="text-destructive">{failedImageFilesCount}件の画像アップロードに失敗しました。</p>
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void onRetryFailedImageUploads()}
              disabled={uploadingImages}
            >
              {uploadingImages ? "再試行中..." : "失敗分を再試行"}
            </Button>
          </div>
        </div>
      )}
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">画像はまだ登録されていません。</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((image) => image.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {images.map((image, index) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  index={index}
                  total={images.length}
                  reorderingImages={reorderingImages}
                  deletingImageIds={deletingImageIds}
                  onMoveImageUp={onMoveImageUp}
                  onMoveImageDown={onMoveImageDown}
                  onDeleteImage={onDeleteImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
