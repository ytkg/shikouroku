import type { Tag } from "@/entities/entity";
import { useTagEditDialogState } from "../model/use-tag-edit-dialog-state";
import { TagEditDialogView } from "./tag-edit-dialog-view";

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
  const state = useTagEditDialogState({
    open,
    onOpenChange,
    onCreated,
    onDeleted,
    ensureAuthorized
  });

  return (
    <TagEditDialogView
      open={open}
      onOpenChange={onOpenChange}
      tags={tags}
      name={state.name}
      creating={state.creating}
      deletingTagId={state.deletingTagId}
      canClose={state.canClose}
      error={state.error}
      onNameChange={state.setName}
      onSubmit={state.onSubmit}
      onDelete={state.onDelete}
      onClose={state.onClose}
    />
  );
}
