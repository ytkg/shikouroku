import { type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEntityForm } from "../model/use-create-entity-form";
import { TagEditDialog } from "../../manage-tags";
import { RelatedEntityEditDialog } from "../../manage-related";
import { EntityFormFields } from "../../shared/ui/entity-form-fields";
import { EntityFormPageSkeleton } from "../../shared/ui/entity-form-page-skeleton";
import { EntityImageUploadField } from "../../shared/ui/entity-image-upload-field";
import { EntityPageActionRow } from "../../shared/ui/entity-page-action-row";
import { getEntityDetailPath, routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function CreateEntityPageContent() {
  const navigate = useNavigate();
  const form = useCreateEntityForm();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const createdEntityId = await form.submit();
    if (createdEntityId) {
      navigate(getEntityDetailPath(createdEntityId));
    }
  };

  if (form.loading) {
    return <EntityFormPageSkeleton />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-16">
      <form className="w-full space-y-3" onSubmit={onSubmit}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>嗜好 新規登録</CardTitle>
            <CardDescription>種別を選択して嗜好を登録します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EntityFormFields
              kinds={form.kinds}
              tags={form.tags}
              kindId={form.kindId}
              name={form.name}
              description={form.description}
              latitude={form.latitude}
              longitude={form.longitude}
              isWishlist={form.isWishlist}
              selectedTagIds={form.selectedTagIds}
              relatedCandidates={form.relatedCandidates}
              selectedRelatedEntityIds={form.selectedRelatedEntityIds}
              onKindIdChange={form.setKindId}
              onNameChange={form.setName}
              onDescriptionChange={form.setDescription}
              onLatitudeChange={form.setLatitude}
              onLongitudeChange={form.setLongitude}
              onWishlistChange={form.setIsWishlist}
              onToggleTag={form.onToggleTag}
              onOpenTagDialog={() => form.setTagDialogOpen(true)}
              onOpenRelatedDialog={() => form.setRelatedDialogOpen(true)}
              imageFieldContent={
                <EntityImageUploadField
                  selectedImageFiles={form.selectedImageFiles}
                  failedImageFilesCount={form.failedImageFiles.length}
                  retryingFailedImages={form.retryingFailedImages}
                  onSelectImageFiles={form.onSelectImageFiles}
                  onRemoveSelectedImage={form.onRemoveSelectedImage}
                  onRetryFailedImageUploads={form.retryFailedImageUploads}
                />
              }
            />
            {form.error && <p className="text-sm text-destructive">{form.error}</p>}
          </CardContent>
        </Card>
        <EntityPageActionRow
          leftAction={
            <Button variant="outline" onClick={() => navigate(routePaths.home)}>
              一覧へ戻る
            </Button>
          }
          rightAction={
            <Button type="submit" disabled={form.submitLoading}>
              {form.submitLoading ? "登録中..." : "登録する"}
            </Button>
          }
        />
      </form>
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
