import { ChevronDown } from "lucide-react";
import { toKindTab, type EntityKindTab } from "../model/entity-list";
import type { EntitySearchField, EntitySearchMatch, Kind } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { EntitySearchOptions } from "./entity-search-options";

type EntityListFilterPanelProps = {
  kinds: Kind[];
  selectedKindTab: EntityKindTab;
  isSearchOptionsOpen: boolean;
  query: string;
  match: EntitySearchMatch;
  selectedFields: EntitySearchField[];
  isAllFieldsSelected: boolean;
  onSelectKindTab: (tab: EntityKindTab) => void;
  onToggleSearchOptions: () => void;
  onQueryChange: (query: string) => void;
  onQueryCompositionStart: () => void;
  onQueryCompositionEnd: () => void;
  onMatchChange: (match: EntitySearchMatch) => void;
  onSelectAllFields: () => void;
  onToggleField: (field: EntitySearchField) => void;
};

export function EntityListFilterPanel({
  kinds,
  selectedKindTab,
  isSearchOptionsOpen,
  query,
  match,
  selectedFields,
  isAllFieldsSelected,
  onSelectKindTab,
  onToggleSearchOptions,
  onQueryChange,
  onQueryCompositionStart,
  onQueryCompositionEnd,
  onMatchChange,
  onSelectAllFields,
  onToggleField
}: EntityListFilterPanelProps) {
  const searchOptionsToggleButton = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-expanded={isSearchOptionsOpen}
      aria-controls="entity-search-options"
      aria-label={isSearchOptionsOpen ? "検索条件を閉じる" : "検索条件を開く"}
      onClick={onToggleSearchOptions}
    >
      <ChevronDown
        className={`h-4 w-4 transition-transform ${isSearchOptionsOpen ? "rotate-180" : "rotate-0"}`}
        aria-hidden="true"
      />
    </Button>
  );

  return (
    <div className="relative rounded-lg border bg-card p-3">
      <div className="space-y-3 pb-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">種別</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={selectedKindTab === "all" ? "default" : "outline"} onClick={() => onSelectKindTab("all")}>
              すべて
            </Button>
            {kinds.map((kind) => (
              <Button
                key={kind.id}
                size="sm"
                variant={selectedKindTab === toKindTab(kind.id) ? "default" : "outline"}
                onClick={() => onSelectKindTab(toKindTab(kind.id))}
              >
                {kind.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={selectedKindTab === "wishlist" ? "default" : "outline"}
              onClick={() => onSelectKindTab("wishlist")}
            >
              気になる
            </Button>
          </div>
        </div>

        {isSearchOptionsOpen && (
          <EntitySearchOptions
            query={query}
            match={match}
            selectedFields={selectedFields}
            isAllFieldsSelected={isAllFieldsSelected}
            onQueryChange={onQueryChange}
            onQueryCompositionStart={onQueryCompositionStart}
            onQueryCompositionEnd={onQueryCompositionEnd}
            onMatchChange={onMatchChange}
            onSelectAllFields={onSelectAllFields}
            onToggleField={onToggleField}
          />
        )}
      </div>
      <div className="absolute bottom-2 right-2">{searchOptionsToggleButton}</div>
    </div>
  );
}
