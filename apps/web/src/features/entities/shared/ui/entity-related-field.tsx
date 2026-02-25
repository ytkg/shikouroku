import type { Entity } from "@/entities/entity";
import { RelatedEntityCard } from "./related-entity-card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

type RelatedCandidate = Pick<Entity, "id" | "name" | "kind" | "isWishlist" | "description" | "tags" | "firstImageUrl">;

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
            const fallbackEntity: RelatedCandidate = {
              id: entityId,
              name: entityId,
              kind: { id: 0, label: "未分類" },
              isWishlist: false,
              description: null,
              tags: [],
              firstImageUrl: null
            };
            return (
              <RelatedEntityCard
                key={entityId}
                entity={candidate ?? fallbackEntity}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
