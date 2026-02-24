import type { Entity } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

type RelatedCandidate = Pick<Entity, "id" | "name" | "kind">;

type EntityRelatedFieldProps = {
  relatedCandidates: RelatedCandidate[];
  selectedRelatedEntityIds: string[];
  onOpenRelatedDialog: () => void;
};

export function EntityRelatedField({
  relatedCandidates,
  selectedRelatedEntityIds,
  onOpenRelatedDialog
}: EntityRelatedFieldProps) {
  const relatedLabelById = new Map(
    relatedCandidates.map((candidate) => [
      candidate.id,
      `${candidate.name}（${candidate.kind.label}）`
    ])
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>関連嗜好</Label>
        <Button type="button" size="sm" variant="outline" onClick={onOpenRelatedDialog}>
          関連を編集
        </Button>
      </div>
      {selectedRelatedEntityIds.length > 0 && (
        <div className="space-y-2">
          {selectedRelatedEntityIds.map((entityId) => (
            <div key={entityId} className="rounded-lg border border-border/70 bg-card/80 px-3 py-2">
              <p className="ui-body-text">{relatedLabelById.get(entityId) ?? entityId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
