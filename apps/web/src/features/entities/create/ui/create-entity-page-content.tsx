import { type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEntityForm } from "../model/use-create-entity-form";
import { TagEditDialog } from "../../manage-tags";
import { RelatedEntityEditDialog } from "../../manage-related";
import { EntityFormFields } from "../../shared/ui/entity-form-fields";
import { routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

export function CreateEntityPageContent() {
  const navigate = useNavigate();
  const form = useCreateEntityForm();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await form.submit();
  };

  if (form.loading) {
    return <main className="w-full bg-background pt-20" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>嗜好 新規登録</CardTitle>
          <CardDescription>種別を選択して嗜好を登録します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
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
              beforeRelatedContent={
                <div className="space-y-2">
                  <Label htmlFor="entity-images">画像</Label>
                  <Input
                    id="entity-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      const files = event.target.files ? Array.from(event.target.files) : [];
                      form.onSelectImageFiles(files);
                      event.target.value = "";
                    }}
                  />
                  {form.selectedImageFiles.length > 0 ? (
                    <div className="space-y-2">
                      {form.selectedImageFiles.map((file, index) => (
                        <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                          <p className="truncate">
                            {file.name} ({toFileSizeLabel(file.size)})
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => form.onRemoveSelectedImage(index)}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">画像はまだ選択されていません。</p>
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
                          disabled={form.retryingFailedImages}
                        >
                          {form.retryingFailedImages ? "再試行中..." : "失敗分を再試行"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              }
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.submitLoading}>
                {form.submitLoading ? "登録中..." : "登録する"}
              </Button>
            </div>
          </form>
          {form.error && <p className="text-sm text-destructive">{form.error}</p>}
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => navigate(routePaths.home)}>
        一覧へ戻る
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
