import { type FormEvent, useEffect, useState } from "react";
import type { Tag } from "@/entities/entity";
import { useTagMutations } from "@/entities/entity";
import { ApiError } from "@/shared/api/api-error";
import { errorMessages } from "@/shared/config/error-messages";
import { toErrorMessage } from "@/shared/lib/error-message";
import { notificationMessageKeys } from "@/shared/config/notification-messages";
import { notify } from "@/shared/lib/notify";
import { resolveOperationErrorMessageKey } from "@/shared/lib/notification-error";

type UseTagEditDialogStateInput = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tag: Tag) => void;
  onDeleted: (tagId: number) => void;
  ensureAuthorized: (status: number) => boolean;
};

type UseTagEditDialogStateResult = {
  name: string;
  query: string;
  error: string | null;
  creating: boolean;
  deletingTagId: number | null;
  canClose: boolean;
  setName: (name: string) => void;
  setQuery: (query: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDelete: (tag: Tag) => Promise<void>;
};

export function useTagEditDialogState({
  open,
  onOpenChange,
  onCreated,
  onDeleted,
  ensureAuthorized
}: UseTagEditDialogStateInput): UseTagEditDialogStateResult {
  const { createTag, deleteTag } = useTagMutations();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  useEffect(() => {
    setName("");
    setQuery("");
    setError(null);
    setCreating(false);
    setDeletingTagId(null);
  }, [open]);

  const canClose = !creating && deletingTagId === null;

  const onClose = () => {
    if (!canClose) {
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
      notify({
        type: "success",
        messageKey: notificationMessageKeys.tagAddSuccess
      });
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(toErrorMessage(e));
      notify({
        type: "error",
        messageKey: resolveOperationErrorMessageKey(e, "save")
      });
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
      notify({
        type: "success",
        messageKey: notificationMessageKeys.tagRemoveSuccess
      });
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(toErrorMessage(e));
      notify({
        type: "error",
        messageKey: resolveOperationErrorMessageKey(e, "delete")
      });
    } finally {
      setDeletingTagId(null);
    }
  };

  return {
    name,
    query,
    error,
    creating,
    deletingTagId,
    canClose,
    setName,
    setQuery,
    onClose,
    onSubmit,
    onDelete
  };
}
