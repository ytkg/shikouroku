import type { Entity } from "@/entities/entity";

type EntityDetailSummarySectionProps = {
  entity: Entity;
  onTagClick: (tagName: string) => void;
};

export function EntityDetailSummarySection({ entity, onTagClick }: EntityDetailSummarySectionProps) {
  const kindLabel = entity.kind.label ?? "不明";

  return (
    <>
      <div className="space-y-1">
        <p className="ui-meta-text">ID</p>
        <p className="break-all text-xs text-foreground/80">{entity.id}</p>
      </div>
      <div className="space-y-1">
        <p className="ui-meta-text">種別</p>
        <p className="ui-body-text">{kindLabel}</p>
      </div>
      <div className="space-y-1">
        <p className="ui-meta-text">メモ</p>
        <p className="ui-body-text whitespace-pre-wrap">
          {entity.description && entity.description.length > 0 ? entity.description : "（メモなし）"}
        </p>
      </div>
      {entity.tags.length > 0 && (
        <div className="space-y-1">
          <p className="ui-meta-text">タグ</p>
          <div className="flex flex-wrap gap-2">
            {entity.tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="ui-pill ui-pill-interactive"
                onClick={() => onTagClick(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
