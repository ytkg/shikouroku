import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toFileSizeLabel } from "@/shared/lib/to-file-size-label";

type EntityImageUploadFieldProps = {
  selectedImageFiles: File[];
  failedImageFilesCount: number;
  retryingFailedImages: boolean;
  onSelectImageFiles: (files: File[]) => void;
  onRemoveSelectedImage: (index: number) => void;
  onRetryFailedImageUploads: () => Promise<void>;
};

export function EntityImageUploadField({
  selectedImageFiles,
  failedImageFilesCount,
  retryingFailedImages,
  onSelectImageFiles,
  onRemoveSelectedImage,
  onRetryFailedImageUploads
}: EntityImageUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="entity-images">画像</Label>
      <Input
        id="entity-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          onSelectImageFiles(files);
          event.target.value = "";
        }}
      />
      {selectedImageFiles.length > 0 ? (
        <div className="space-y-2">
          {selectedImageFiles.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <p className="truncate">
                {file.name} ({toFileSizeLabel(file.size)})
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => onRemoveSelectedImage(index)}>
                削除
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">画像はまだ選択されていません。</p>
      )}
      {failedImageFilesCount > 0 && (
        <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm">
          <p className="text-destructive">{failedImageFilesCount}件の画像アップロードに失敗しました。</p>
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void onRetryFailedImageUploads()}
              disabled={retryingFailedImages}
            >
              {retryingFailedImages ? "再試行中..." : "失敗分を再試行"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
