import { useNavigate } from "react-router-dom";
import type { Entity } from "@/entities/entity";

type EntityListResultCardProps = {
  entity: Entity;
  detailPath: string;
  detailSearch: string;
  onTagClick: (tagName: string) => void;
};

export function EntityListResultCard({
  entity,
  detailPath,
  detailSearch,
  onTagClick
}: EntityListResultCardProps) {
  const navigate = useNavigate();
  const moveToDetail = () => {
    navigate({
      pathname: detailPath,
      search: detailSearch
    });
  };

  return (
    <article
      role="link"
      tabIndex={0}
      className="cursor-pointer rounded-xl border border-border/70 bg-card/95 p-4 transition-colors hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={moveToDetail}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        moveToDetail();
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="ui-section-title">{entity.name}</h3>
            {entity.isWishlist && <span className="ui-pill">気になる</span>}
          </div>
          <p className="ui-meta-text mt-1">種別: {entity.kind.label}</p>
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
      {entity.description && (
        <p className="ui-body-text mt-2 overflow-hidden text-ellipsis whitespace-nowrap">{entity.description}</p>
      )}
      {entity.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {entity.tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="ui-pill ui-pill-interactive"
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
    </article>
  );
}
