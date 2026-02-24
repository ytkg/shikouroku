import type { Entity } from "@/entities/entity";
import { RelatedEntityCard } from "./related-entity-card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

type RelatedCandidate = Pick<Entity, "id" | "name" | "kind" | "firstImageUrl">;

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
  const relatedCandidateById = new Map(relatedCandidates.map((candidate) => [candidate.id, candidate]));

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
          {selectedRelatedEntityIds.map((entityId) => {
            const candidate = relatedCandidateById.get(entityId);
            const label = candidate ? `${candidate.name}（${candidate.kind.label}）` : entityId;
            return (
              <RelatedEntityCard
                key={entityId}
                label={label}
                firstImageUrl={candidate?.firstImageUrl}
                imageAlt={candidate ? `${candidate.name}の画像サムネイル` : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
