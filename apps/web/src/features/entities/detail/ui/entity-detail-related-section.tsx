import type { Entity } from "@/entities/entity";

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
            <article
              key={relatedEntity.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer rounded-lg border border-border/70 bg-card/80 px-3 py-2 transition-colors hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => onSelectRelatedEntity(relatedEntity.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                  return;
                }

                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();
                onSelectRelatedEntity(relatedEntity.id);
              }}
            >
              <p className="ui-body-text text-left">
                {relatedEntity.name}（{relatedEntity.kind.label}）
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
