import type { EntityImage } from "@/entities/entity";
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
  onMoveImageUp: (imageId: string) => Promise<void>;
  onMoveImageDown: (imageId: string) => Promise<void>;
  onDeleteImage: (imageId: string) => Promise<void>;
};

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
  onDeleteImage
}: EntityImageEditorFieldProps) {
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
        <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm">
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
        <div className="space-y-2">
          {images.map((image, index) => (
            <div key={image.id} className="rounded-md border p-3">
              <div className="flex items-start gap-3">
                <img src={image.url} alt={image.fileName} className="h-20 w-20 rounded-md object-cover" loading="lazy" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{image.fileName}</p>
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
                  onClick={() => void onMoveImageUp(image.id)}
                >
                  上へ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index === images.length - 1 || reorderingImages}
                  onClick={() => void onMoveImageDown(image.id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
