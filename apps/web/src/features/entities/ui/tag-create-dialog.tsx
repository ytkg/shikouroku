import { type FormEvent, useEffect, useState } from "react";
import { ApiError, createTag } from "@/features/entities/api/entities-api";
import type { Tag } from "@/features/entities/model/entity-types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type TagCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tag: Tag) => void;
  ensureAuthorized: (status: number) => boolean;
};

export function TagCreateDialog({
  open,
  onOpenChange,
  onCreated,
  ensureAuthorized
}: TagCreateDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange, submitting]);

  const onClose = () => {
    if (submitting) {
      return;
    }
    onOpenChange(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length === 0) {
      setError("タグ名を入力してください");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const tag = await createTag({ name: normalizedName });
      onCreated(tag);
      onOpenChange(false);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="タグ登録"
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
        <h2 className="text-base font-semibold">タグ登録</h2>
        <p className="mt-1 text-sm text-muted-foreground">新しいタグ名を入力してください。</p>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "登録中..." : "登録"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
