import { useNavigate, useParams } from "react-router-dom";
import { useEditEntityForm } from "../model/use-edit-entity-form";
import { TagEditDialog } from "../../manage-tags";
import { RelatedEntityEditDialog } from "../../manage-related";
import { EntityFormFields } from "../../shared/ui/entity-form-fields";
import { getEntityDetailPath, routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

function toFileSizeLabel(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

export function EditEntityPageContent() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const form = useEditEntityForm(entityId);
  const detailPath = entityId ? getEntityDetailPath(entityId) : routePaths.home;

  if (form.loading) {
    return <main className="w-full bg-background pt-20" />;
  }

  const onSave = async () => {
    const saved = await form.save();
    if (saved) {
      navigate(detailPath);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>嗜好 編集</CardTitle>
          <CardDescription>内容を編集して保存します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.error && <p className="text-sm text-destructive">{form.error}</p>}
          {form.entity && (
            <div className="space-y-4">
              <EntityFormFields
                kinds={form.kinds}
                tags={form.tags}
                kindId={form.kindId}
                name={form.name}
                description={form.description}
                isWishlist={form.isWishlist}
                selectedTagIds={form.selectedTagIds}
                relatedCandidates={form.relatedCandidates}
                selectedRelatedEntityIds={form.selectedRelatedEntityIds}
                onKindIdChange={form.setKindId}
                onNameChange={form.setName}
                onDescriptionChange={form.setDescription}
                onWishlistChange={form.setIsWishlist}
                onToggleTag={form.onToggleTag}
                onOpenTagDialog={() => form.setTagDialogOpen(true)}
                onOpenRelatedDialog={() => form.setRelatedDialogOpen(true)}
                kindRequired={false}
                beforeRelatedContent={
                  <div className="space-y-2">
                    <Label htmlFor="entity-images-edit">画像</Label>
                    <Input
                      id="entity-images-edit"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => {
                        void form.onSelectImageFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                    {form.uploadingImages && (
                      <p className="text-sm text-muted-foreground">画像をアップロード中...</p>
                    )}
                    {form.failedImageFiles.length > 0 && (
                      <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm">
                        <p className="text-destructive">
                          {form.failedImageFiles.length}件の画像アップロードに失敗しました。
                        </p>
                        <div className="mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void form.retryFailedImageUploads()}
                            disabled={form.uploadingImages}
                          >
                            {form.uploadingImages ? "再試行中..." : "失敗分を再試行"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {form.images.length === 0 ? (
                      <p className="text-sm text-muted-foreground">画像はまだ登録されていません。</p>
                    ) : (
                      <div className="space-y-2">
                        {form.images.map((image, index) => (
                          <div key={image.id} className="rounded-md border p-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={image.url}
                                alt={image.fileName}
                                className="h-20 w-20 rounded-md object-cover"
                                loading="lazy"
                              />
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
                                disabled={index === 0 || form.reorderingImages}
                                onClick={() => void form.moveImageUp(image.id)}
                              >
                                上へ
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={index === form.images.length - 1 || form.reorderingImages}
                                onClick={() => void form.moveImageDown(image.id)}
                              >
                                下へ
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={form.deletingImageIds.includes(image.id)}
                                onClick={() => void form.deleteImage(image.id)}
                              >
                                {form.deletingImageIds.includes(image.id) ? "削除中..." : "削除"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => void onSave()} disabled={form.saving}>
            {form.saving ? "保存中..." : "保存"}
          </Button>
        </CardFooter>
      </Card>
      <Button variant="outline" onClick={() => navigate(detailPath)}>
        詳細へ戻る
      </Button>
      <TagEditDialog
        open={form.tagDialogOpen}
        onOpenChange={form.setTagDialogOpen}
        tags={form.tags}
        onCreated={form.onTagCreated}
        onDeleted={form.onTagDeleted}
        ensureAuthorized={form.ensureAuthorized}
      />
      <RelatedEntityEditDialog
        open={form.relatedDialogOpen}
        onOpenChange={form.setRelatedDialogOpen}
        candidates={form.relatedCandidates}
        selectedRelatedEntityIds={form.selectedRelatedEntityIds}
        onToggleRelatedEntity={form.onToggleRelatedEntity}
      />
    </main>
  );
}
