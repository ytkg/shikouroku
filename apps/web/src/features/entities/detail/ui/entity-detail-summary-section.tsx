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
        <p className="text-xs text-muted-foreground">ID</p>
        <p className="break-all text-xs">{entity.id}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">種別</p>
        <p className="text-sm">{kindLabel}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">メモ</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {entity.description && entity.description.length > 0 ? entity.description : "（メモなし）"}
        </p>
      </div>
      {entity.tags.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">タグ</p>
          <div className="flex flex-wrap gap-2">
            {entity.tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
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
