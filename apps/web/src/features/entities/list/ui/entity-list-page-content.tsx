import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useEntityListPage } from "../model/use-entity-list-page";
import { ENTITY_SEARCH_FIELDS } from "@/entities/entity";
import { getEntityDetailPath } from "@/shared/config/route-paths";
import { EntityListFilterPanel } from "./entity-list-filter-panel";
import { EntityListLoadMore } from "./entity-list-load-more";
import { EntityListResultCard } from "./entity-list-result-card";
import { useInfiniteLoadTrigger } from "./use-infinite-load-trigger";

export function EntityListPageContent() {
  const location = useLocation();
  const page = useEntityListPage();
  const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);
  const canUseIntersectionObserver = typeof IntersectionObserver !== "undefined";
  const loadMoreTriggerRef = useInfiniteLoadTrigger({
    enabled: canUseIntersectionObserver && page.hasMore,
    isLoading: page.isLoading,
    isLoadingMore: page.isLoadingMore,
    onLoadMore: page.loadMore
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl items-start px-4 pb-4 pt-20">
      <section className="w-full space-y-3">
        <EntityListFilterPanel
          kinds={page.kinds}
          selectedKindTab={page.selectedKindTab}
          isSearchOptionsOpen={isSearchOptionsOpen}
          query={page.query}
          match={page.match}
          selectedFields={page.selectedFields}
          isAllFieldsSelected={page.isAllFieldsSelected}
          onSelectKindTab={page.setSelectedKindTab}
          onToggleSearchOptions={() => {
            if (isSearchOptionsOpen) {
              page.endQueryComposition();
            }
            setIsSearchOptionsOpen((current) => !current);
          }}
          onQueryChange={page.setQuery}
          onQueryCompositionStart={page.startQueryComposition}
          onQueryCompositionEnd={page.endQueryComposition}
          onMatchChange={page.setMatch}
          onSelectAllFields={() => page.setSelectedFields([...ENTITY_SEARCH_FIELDS])}
          onToggleField={page.toggleField}
        />

        {page.error && <p className="text-sm text-destructive">{page.error}</p>}
        {!page.error && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>総件数: {page.totalCount}件</p>
            <p>{page.isLoading ? "検索中..." : ""}</p>
          </div>
        )}

        {page.entities.length === 0 ? (
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            {page.isLoading ? "読み込み中..." : "表示できる登録がありません。"}
          </div>
        ) : (
          page.entities.map((entity) => (
            <EntityListResultCard
              key={entity.id}
              entity={entity}
              detailPath={getEntityDetailPath(entity.id)}
              detailSearch={location.search}
              onTagClick={page.applyTagFilter}
            />
          ))
        )}

        {page.hasMore && (
          <EntityListLoadMore
            canUseIntersectionObserver={canUseIntersectionObserver}
            isLoadingMore={page.isLoadingMore}
            onLoadMore={page.loadMore}
            triggerRef={loadMoreTriggerRef}
          />
        )}
      </section>
    </main>
  );
}
