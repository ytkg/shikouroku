import { type FormEvent, useEffect, useState } from "react";
import type { Tag } from "@/entities/entity";
import { useTagMutations } from "@/entities/entity";
import { ApiError } from "@/shared/api/api-error";
import { errorMessages } from "@/shared/config/error-messages";
import { toErrorMessage } from "@/shared/lib/error-message";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ModalShell } from "@/shared/ui/modal-shell";

type TagEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  onCreated: (tag: Tag) => void;
  onDeleted: (tagId: number) => void;
  ensureAuthorized: (status: number) => boolean;
};

export function TagEditDialog({
  open,
  onOpenChange,
  tags,
  onCreated,
  onDeleted,
  ensureAuthorized
}: TagEditDialogProps) {
  const { createTag, deleteTag } = useTagMutations();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setError(null);
    setCreating(false);
    setDeletingTagId(null);
  }, [open]);

  const onClose = () => {
    if (creating || deletingTagId !== null) {
      return;
    }
    onOpenChange(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length === 0) {
      setError(errorMessages.tagNameRequired);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const tag = await createTag({ name: normalizedName });
      onCreated(tag);
      setName("");
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(toErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (tag: Tag) => {
    if (!window.confirm(`タグ「${tag.name}」を削除しますか？`)) {
      return;
    }

    setDeletingTagId(tag.id);
    setError(null);
    try {
      await deleteTag(tag.id);
      onDeleted(tag.id);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(toErrorMessage(e));
    } finally {
      setDeletingTagId(null);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      canClose={!creating && deletingTagId === null}
      ariaLabel="タグ編集"
      contentClassName="max-w-md"
    >
      <h2 className="text-base font-semibold">タグを編集</h2>
      <p className="mt-1 text-sm text-muted-foreground">タグの追加・削除ができます。</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="new-tag-name">タグ名</Label>
          <Input
            id="new-tag-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例: かわいい"
            autoFocus
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={creating || deletingTagId !== null}>
            {creating ? "登録中..." : "登録"}
          </Button>
        </div>
      </form>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground">登録済みタグ</p>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">タグが登録されていません。</p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-auto">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-sm">{tag.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void onDelete(tag);
                  }}
                  disabled={creating || deletingTagId !== null}
                >
                  {deletingTagId === tag.id ? "削除中..." : "削除"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={creating || deletingTagId !== null}>
          閉じる
        </Button>
      </div>
    </ModalShell>
  );
}
