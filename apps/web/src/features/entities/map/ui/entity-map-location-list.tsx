import type { Tag } from "@/entities/entity";
import type { MapLocationEntity } from "./entity-map-types";

type EntityMapLocationListProps = {
  entities: MapLocationEntity[];
  tagsByEntityId: Map<string, Tag[]>;
  onSelect: (entityId: string) => void;
};

export function EntityMapLocationList({ entities, tagsByEntityId, onSelect }: EntityMapLocationListProps) {
  return (
    <div className="h-full overflow-y-auto rounded-xl border border-border/70 bg-card/95 p-2">
      <ul className="space-y-2 text-sm">
        {entities.map((entity) => (
          <li key={entity.id}>
            <button
              type="button"
              className="w-full rounded-lg border border-border/70 bg-card/95 p-2 text-left transition-colors hover:bg-accent/35"
              onClick={() => onSelect(entity.id)}
            >
              <p className="font-medium">{entity.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(tagsByEntityId.get(entity.id) ?? []).slice(0, 3).map((tag) => (
                  <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    {tag.name}
                  </span>
                ))}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
