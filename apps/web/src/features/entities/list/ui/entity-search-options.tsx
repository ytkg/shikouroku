import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/form-controls/select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ENTITY_SEARCH_FIELDS, type EntitySearchField, type EntitySearchMatch } from "@/entities/entity";

type EntitySearchOptionsProps = {
  query: string;
  match: EntitySearchMatch;
  selectedFields: EntitySearchField[];
  isAllFieldsSelected: boolean;
  onQueryChange: (query: string) => void;
  onQueryCompositionStart: () => void;
  onQueryCompositionEnd: () => void;
  onMatchChange: (match: EntitySearchMatch) => void;
  onSelectAllFields: () => void;
  onToggleField: (field: EntitySearchField) => void;
};

const ENTITY_SEARCH_MATCH_LABELS: Record<EntitySearchMatch, string> = {
  partial: "部分一致",
  prefix: "前方一致",
  exact: "完全一致"
};

const ENTITY_SEARCH_FIELD_LABELS: Record<EntitySearchField, string> = {
  title: "タイトル",
  body: "本文",
  tags: "タグ"
};

export function EntitySearchOptions({
  query,
  match,
  selectedFields,
  isAllFieldsSelected,
  onQueryChange,
  onQueryCompositionStart,
  onQueryCompositionEnd,
  onMatchChange,
  onSelectAllFields,
  onToggleField
}: EntitySearchOptionsProps) {
  const selectedFieldSet = new Set(selectedFields);

  return (
    <div id="entity-search-options" className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="entity-search-input">キーワード</Label>
          <Input
            id="entity-search-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onCompositionStart={onQueryCompositionStart}
            onCompositionEnd={onQueryCompositionEnd}
            onBlur={onQueryCompositionEnd}
            placeholder="タイトル・本文・タグで検索"
            autoComplete="off"
          />
        </div>
        <div className="w-32 shrink-0 space-y-2">
          <Select
            id="entity-search-match"
            aria-label="一致条件"
            value={match}
            onChange={(event) => onMatchChange(event.target.value as EntitySearchMatch)}
          >
            {Object.entries(ENTITY_SEARCH_MATCH_LABELS).map(([nextMatch, label]) => (
              <option key={nextMatch} value={nextMatch}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">検索対象</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={isAllFieldsSelected ? "default" : "outline"} onClick={onSelectAllFields}>
            すべて
          </Button>
          {ENTITY_SEARCH_FIELDS.map((field) => {
            const checked = !isAllFieldsSelected && selectedFieldSet.has(field);
            return (
              <Button key={field} size="sm" variant={checked ? "default" : "outline"} onClick={() => onToggleField(field)}>
                {ENTITY_SEARCH_FIELD_LABELS[field]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
