import { useEffect } from "react";
import type { Entity } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/form-controls";
import { Label } from "@/shared/ui/label";

type RelatedEntityDialogProps = {
  open: boolean;
  candidates: Entity[];
  selectedRelatedEntityId: string;
  saving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectedRelatedEntityIdChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function RelatedEntityDialog({
  open,
  candidates,
  selectedRelatedEntityId,
  saving,
  error,
  onOpenChange,
  onSelectedRelatedEntityIdChange,
  onSubmit
}: RelatedEntityDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange, saving]);

  if (!open) {
    return null;
  }

  const hasCandidates = candidates.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onOpenChange(false);
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="関連嗜好を追加"
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
        <h2 className="text-base font-semibold">関連嗜好を追加</h2>
        <p className="mt-1 text-sm text-muted-foreground">関連付けたい嗜好を1つ選択します。</p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="related-entity">候補</Label>
          {hasCandidates ? (
            <Select
              id="related-entity"
              value={selectedRelatedEntityId}
              onChange={(event) => onSelectedRelatedEntityIdChange(event.target.value)}
              disabled={saving}
            >
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}（{candidate.kind.label}）
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">追加できる候補がありません。</p>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            閉じる
          </Button>
          <Button
            type="button"
            onClick={() => {
              void onSubmit();
            }}
            disabled={saving || !hasCandidates}
          >
            {saving ? "追加中..." : "追加"}
          </Button>
        </div>
      </div>
    </div>
  );
}
