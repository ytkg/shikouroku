import type { Entity } from "@/entities/entity";
import { RelatedEntityCard } from "../../shared/ui/related-entity-card";

type EntityDetailRelatedSectionProps = {
  relatedLoading: boolean;
  relatedEntities: Entity[];
  onSelectRelatedEntity: (entityId: string) => void;
};

export function EntityDetailRelatedSection({
  relatedLoading,
  relatedEntities,
  onSelectRelatedEntity
}: EntityDetailRelatedSectionProps) {
  if (!relatedLoading && relatedEntities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="ui-meta-text">関連嗜好</p>
      {relatedLoading ? (
        <p className="ui-body-text">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {relatedEntities.map((relatedEntity) => (
            <RelatedEntityCard
              key={relatedEntity.id}
              entity={relatedEntity}
              interactive
              onSelect={() => onSelectRelatedEntity(relatedEntity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
