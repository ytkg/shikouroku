import { useEffect } from "react";
import type { Entity } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/form-controls";

type RelatedEntityEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Entity[];
  selectedRelatedEntityIds: string[];
  onToggleRelatedEntity: (entityId: string, checked: boolean) => void;
};

export function RelatedEntityEditDialog({
  open,
  onOpenChange,
  candidates,
  selectedRelatedEntityIds,
  onToggleRelatedEntity
}: RelatedEntityEditDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="関連嗜好を編集"
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
        <h2 className="text-base font-semibold">関連嗜好を編集</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          チェックを付けると関連追加、外すと関連解除になります。
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">候補一覧</p>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">追加できる候補がありません。</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-auto rounded-md border p-2">
              {candidates.map((candidate) => (
                <label key={candidate.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm">
                  <Checkbox
                    checked={selectedRelatedEntityIds.includes(candidate.id)}
                    onChange={(event) => onToggleRelatedEntity(candidate.id, event.target.checked)}
                  />
                  {candidate.name}（{candidate.kind.label}）
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
