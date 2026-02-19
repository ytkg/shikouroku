import { type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEntityForm } from "../model/use-create-entity-form";
import { TagEditDialog } from "../../manage-tags/ui/tag-edit-dialog";
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
import { Label } from "@/shared/ui/label";

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
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-10 pt-24">
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
              onKindIdChange={form.setKindId}
              onNameChange={form.setName}
              onDescriptionChange={form.setDescription}
              onWishlistChange={form.setIsWishlist}
              onToggleTag={form.onToggleTag}
              onOpenTagDialog={() => form.setTagDialogOpen(true)}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.submitLoading}>
                {form.submitLoading ? "登録中..." : "登録する"}
              </Button>
            </div>
          </form>
          {form.error && <p className="text-sm text-destructive">{form.error}</p>}
          <div className="space-y-2">
            <Label>登録結果</Label>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-sm">
              {form.submitResult ? JSON.stringify(form.submitResult, null, 2) : "まだ登録していません"}
            </pre>
          </div>
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
    </main>
  );
}
