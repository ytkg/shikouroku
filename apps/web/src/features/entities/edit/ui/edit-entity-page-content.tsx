import { useNavigate, useParams } from "react-router-dom";
import { useEditEntityForm } from "../model/use-edit-entity-form";
import { TagEditDialog } from "../../manage-tags";
import { RelatedEntityEditDialog } from "../../manage-related";
import { EntityFormFields } from "../../shared/ui/entity-form-fields";
import { EntityImageEditorField } from "../../shared/ui/entity-image-editor-field";
import { EntityFormPageSkeleton } from "../../shared/ui/entity-form-page-skeleton";
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

export function EditEntityPageContent() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const form = useEditEntityForm(entityId);
  const detailPath = entityId ? getEntityDetailPath(entityId) : routePaths.home;

  if (form.loading) {
    return <EntityFormPageSkeleton />;
  }

  const onSave = async () => {
    const saved = await form.save();
    if (saved) {
      navigate(detailPath);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-20">
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
                imageFieldContent={
                  <EntityImageEditorField
                    images={form.images}
                    failedImageFilesCount={form.failedImageFiles.length}
                    uploadingImages={form.uploadingImages}
                    reorderingImages={form.reorderingImages}
                    deletingImageIds={form.deletingImageIds}
                    onSelectImageFiles={form.onSelectImageFiles}
                    onRetryFailedImageUploads={form.retryFailedImageUploads}
                    onMoveImageUp={form.moveImageUp}
                    onMoveImageDown={form.moveImageDown}
                    onReorderImages={form.reorderImages}
                    onDeleteImage={form.deleteImage}
                  />
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
