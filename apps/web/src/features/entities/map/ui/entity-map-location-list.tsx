import type { Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import type { MapLocationEntity } from "./entity-map.types";

type EntityMapLocationListProps = {
  entities: MapLocationEntity[];
  tagsByEntityId: Map<string, Tag[]>;
  selectedEntityId: string | null;
  onFocus: (entityId: string) => void;
  onOpenDetail: (entityId: string) => void;
};

export function EntityMapLocationList({
  entities,
  tagsByEntityId,
  selectedEntityId,
  onFocus,
  onOpenDetail
}: EntityMapLocationListProps) {
  return (
    <div className="h-full overflow-y-auto rounded-xl border border-border/70 bg-card/95 p-2">
      <ul className="space-y-2 text-sm">
        {entities.map((entity) => {
          const isSelected = selectedEntityId === entity.id;
          return (
            <li
              key={entity.id}
              className={cn(
                "rounded-lg border border-border/70 bg-card/95 p-2 transition-colors",
                isSelected && "border-primary/60 bg-primary/10"
              )}
            >
              <div aria-live="polite" aria-pressed={isSelected}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{entity.name}</p>
                  {isSelected && (
                    <span className="rounded-full border border-primary/60 bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      選択中
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(tagsByEntityId.get(entity.id) ?? []).slice(0, 3).map((tag) => (
                    <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <Button type="button" size="sm" variant="outline" className="min-w-24" onClick={() => onFocus(entity.id)}>
                  地図で見る
                </Button>
                <Button type="button" size="sm" variant="outline" className="min-w-24" onClick={() => onOpenDetail(entity.id)}>
                  詳細を開く
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
