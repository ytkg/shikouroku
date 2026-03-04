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
  const searchOptionsLabel = isSearchOptionsOpen ? "検索条件を閉じる" : "検索条件を開く";

  const searchOptionsToggleButton = (
    <Button
      type="button"
      variant="ghost"
      className="h-6 w-full justify-center border-0 bg-transparent shadow-none hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      aria-expanded={isSearchOptionsOpen}
      aria-controls="entity-search-options"
      aria-label={searchOptionsLabel}
      onClick={onToggleSearchOptions}
    >
      <ChevronDown
        className={`h-4 w-4 transition-transform ${isSearchOptionsOpen ? "rotate-180" : "rotate-0"}`}
        aria-hidden="true"
      />
    </Button>
  );

  return (
    <div className="rounded-lg border bg-card px-3 pb-1 pt-3">
      <div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">種別</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              className="h-8 whitespace-nowrap px-2 text-xs"
              variant={selectedKindTab === "all" ? "default" : "outline"}
              onClick={() => onSelectKindTab("all")}
            >
              すべて
            </Button>
            {kinds.map((kind) => (
              <Button
                key={kind.id}
                size="sm"
                className="h-8 whitespace-nowrap px-2 text-xs"
                variant={selectedKindTab === toKindTab(kind.id) ? "default" : "outline"}
                onClick={() => onSelectKindTab(toKindTab(kind.id))}
              >
                {kind.label}
              </Button>
            ))}
            <Button
              size="sm"
              className="h-8 whitespace-nowrap px-2 text-xs"
              variant={selectedKindTab === "wishlist" ? "default" : "outline"}
              onClick={() => onSelectKindTab("wishlist")}
            >
              気になる
            </Button>
          </div>
        </div>

        <div
          id="entity-search-options"
          aria-hidden={!isSearchOptionsOpen}
          className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out ${
            isSearchOptionsOpen ? "mt-3 max-h-96 opacity-100" : "mt-0 max-h-0 opacity-0"
          }`}
        >
          <fieldset disabled={!isSearchOptionsOpen}>
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
          </fieldset>
        </div>
      </div>
      <div className="mt-1 flex justify-center">{searchOptionsToggleButton}</div>
    </div>
  );
}
