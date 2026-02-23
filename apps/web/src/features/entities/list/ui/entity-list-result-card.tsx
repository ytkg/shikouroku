import type { Entity } from "@/entities/entity";

type EntityListResultCardProps = {
  entity: Entity;
  onClick: (entityId: string) => void;
  onTagClick: (tagName: string) => void;
};

export function EntityListResultCard({ entity, onClick, onTagClick }: EntityListResultCardProps) {
  return (
    <article
      className="cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
      onClick={() => onClick(entity.id)}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{entity.name}</h3>
            {entity.isWishlist && <span className="rounded-full border px-2 py-0.5 text-xs">気になる</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">種別: {entity.kind.label}</p>
          {entity.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTagClick(tag.name);
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          {entity.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{entity.description}</p>
          )}
        </div>
        {entity.firstImageUrl && (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
            <img
              src={entity.firstImageUrl}
              alt={`${entity.name}の画像サムネイル`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </article>
  );
}
