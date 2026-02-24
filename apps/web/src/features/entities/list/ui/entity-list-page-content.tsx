import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useEntityListPage } from "../model/use-entity-list-page";
import { ENTITY_SEARCH_FIELDS } from "@/entities/entity";
import { getEntityDetailPath } from "@/shared/config/route-paths";
import { Skeleton } from "@/shared/ui/skeleton";
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
  const shouldShowInitialSkeleton = !page.error && page.isLoading && page.entities.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl items-start px-4 pb-4 pt-16">
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

        {shouldShowInitialSkeleton ? (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <article key={`entity-list-skeleton-${index}`} className="rounded-xl border border-border/70 bg-card/95 p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-16 w-16 rounded-lg" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="mt-2 flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </article>
            ))}
          </div>
        ) : page.entities.length === 0 ? (
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
