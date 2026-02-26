import type { Entity } from "@/entities/entity";
import { EntityCardSkeleton } from "../../shared/ui/entity-card-skeleton";
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
        <div className="space-y-2" aria-hidden="true">
          <EntityCardSkeleton />
          <EntityCardSkeleton />
        </div>
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
