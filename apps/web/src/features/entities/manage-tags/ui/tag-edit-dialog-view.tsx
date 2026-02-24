import { type FormEvent } from "react";
import type { Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ModalShell } from "@/shared/ui/modal-shell";
import { TagListEditor } from "./tag-list-editor";

type TagEditDialogViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canClose: boolean;
  tags: Tag[];
  name: string;
  query: string;
  creating: boolean;
  deletingTagId: number | null;
  error: string | null;
  onNameChange: (name: string) => void;
  onQueryChange: (query: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDelete: (tag: Tag) => Promise<void>;
  onClose: () => void;
};

export function TagEditDialogView({
  open,
  onOpenChange,
  canClose,
  tags,
  name,
  query,
  creating,
  deletingTagId,
  error,
  onNameChange,
  onQueryChange,
  onSubmit,
  onDelete,
  onClose
}: TagEditDialogViewProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      canClose={canClose}
      ariaLabel="タグ編集"
      contentClassName="max-w-md"
    >
      <h2 className="text-base font-semibold">タグを編集</h2>
      <p className="mt-1 text-sm text-muted-foreground">タグの追加・削除ができます。</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="new-tag-name">タグ名</Label>
          <Input
            id="new-tag-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="例: かわいい"
            autoFocus
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={!canClose}>
            {creating ? "登録中..." : "登録"}
          </Button>
        </div>
      </form>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground">登録済みタグ</p>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="タグを検索"
          aria-label="タグを検索"
        />
        <TagListEditor
          tags={tags}
          query={query}
          disabled={!canClose}
          deletingTagId={deletingTagId}
          onDelete={onDelete}
        />
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={!canClose}>
          閉じる
        </Button>
      </div>
    </ModalShell>
  );
}
