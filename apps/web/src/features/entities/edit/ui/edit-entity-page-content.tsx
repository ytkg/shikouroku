import { useNavigate, useParams } from "react-router-dom";
import { useEditEntityForm } from "@/features/entities/edit/model/use-edit-entity-form";
import { EntityFormFields } from "@/features/entities/shared/ui/entity-form-fields";
import { TagEditDialog } from "@/features/entities/ui/tag-edit-dialog";
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

  if (form.loading) {
    return <main className="w-full bg-background pt-20" />;
  }

  const onSave = async () => {
    const saved = await form.save();
    if (saved && entityId) {
      navigate(`/entities/${entityId}`);
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
          {form.error ? (
            <p className="text-sm text-destructive">{form.error}</p>
          ) : (
            form.entity && (
              <EntityFormFields
                kinds={form.kinds}
                tags={form.tags}
                kindId={form.kindId}
                name={form.name}
                description={form.description}
                isWishlist={form.isWishlist}
                selectedTagIds={form.selectedTagIds}
                onKindIdChange={form.setKindId}
                onNameChange={form.setName}
                onDescriptionChange={form.setDescription}
                onWishlistChange={form.setIsWishlist}
                onToggleTag={form.onToggleTag}
                onOpenTagDialog={() => form.setTagDialogOpen(true)}
                kindRequired={false}
              />
            )
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => void onSave()} disabled={form.saving}>
            {form.saving ? "保存中..." : "保存"}
          </Button>
        </CardFooter>
      </Card>
      <Button variant="outline" onClick={() => navigate(`/entities/${entityId}`)}>
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
    </main>
  );
}
