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
              className={`cursor-pointer rounded-lg border border-border/70 bg-card/80 transition-colors hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                relatedEntity.firstImageUrl ? "overflow-hidden p-0" : "px-3"
              }`}
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
              <div className="flex min-h-16 items-center gap-3">
                <div className={`min-w-0 flex-1 ${relatedEntity.firstImageUrl ? "px-3" : ""}`}>
                  <p className="ui-body-text text-left">
                    {relatedEntity.name}（{relatedEntity.kind.label}）
                  </p>
                </div>
                {relatedEntity.firstImageUrl && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden border-l border-border/70 bg-muted">
                    <img
                      src={relatedEntity.firstImageUrl}
                      alt={`${relatedEntity.name}の画像サムネイル`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
