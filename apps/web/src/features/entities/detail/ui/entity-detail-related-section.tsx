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
      <p className="text-xs text-muted-foreground">関連嗜好</p>
      {relatedLoading ? (
        <p className="text-sm">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {relatedEntities.map((relatedEntity) => (
            <div key={relatedEntity.id} className="rounded-md border px-3 py-2">
              <button
                type="button"
                className="text-left text-sm hover:underline"
                onClick={() => onSelectRelatedEntity(relatedEntity.id)}
              >
                {relatedEntity.name}（{relatedEntity.kind.label}）
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
