import type { Entity } from "@/entities/entity";

type RelatedEntityCardProps = {
  entity: Pick<Entity, "name" | "kind" | "isWishlist" | "description" | "tags" | "firstImageUrl">;
  interactive?: boolean;
  onSelect?: () => void;
};

export function RelatedEntityCard({
  entity,
  interactive = false,
  onSelect
}: RelatedEntityCardProps) {
  const kindLabel = entity.kind.label.trim();
  const displayedKindLabel = kindLabel.length > 0 ? kindLabel : "未分類";
  const wishlistLabel = kindLabel.length > 0 ? `気になる${kindLabel}` : "気になる項目";
  const rootClassName = "rounded-xl border border-border/70 bg-card/95 p-4";
  const interactiveClassName =
    "cursor-pointer transition-colors hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const content = (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="ui-section-title">{entity.name}</h3>
          {entity.isWishlist ? (
            <span className="ui-pill">{wishlistLabel}</span>
          ) : (
            <span className="ui-pill">{displayedKindLabel}</span>
          )}
        </div>
        {entity.description && (
          <p className="ui-body-text overflow-hidden text-ellipsis whitespace-nowrap">{entity.description}</p>
        )}
        {entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entity.tags.map((tag) => (
              <span key={tag.id} className="ui-pill">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {entity.firstImageUrl && (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
          <img
            src={entity.firstImageUrl}
            alt={`${entity.name}の画像サムネイル`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );

  if (!interactive || !onSelect) {
    return <div className={rootClassName}>{content}</div>;
  }

  return (
    <article
      role="link"
      tabIndex={0}
      className={`${rootClassName} ${interactiveClassName}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        onSelect();
      }}
    >
      {content}
    </article>
  );
}
