import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEntityListPage } from "../model/use-entity-list-page";
import { toKindTab } from "../model/entity-list";
import { ENTITY_SEARCH_FIELDS, type EntitySearchField, type EntitySearchMatch } from "@/entities/entity";
import { getEntityDetailPath } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/form-controls/select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

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

export function EntityListPageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = useEntityListPage();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const autoLoadPendingRef = useRef(false);
  const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);
  const selectedFieldSet = useMemo(() => new Set(page.selectedFields), [page.selectedFields]);
  const canUseIntersectionObserver = typeof IntersectionObserver !== "undefined";
  const hasMore = page.hasMore;
  const isLoading = page.isLoading;
  const isLoadingMore = page.isLoadingMore;
  const loadMore = page.loadMore;

  useEffect(() => {
    if (!isLoadingMore) {
      autoLoadPendingRef.current = false;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    const triggerElement = loadMoreTriggerRef.current;
    if (!canUseIntersectionObserver || !triggerElement || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || autoLoadPendingRef.current || isLoadingMore) {
          return;
        }

        autoLoadPendingRef.current = true;
        void loadMore();
      },
      {
        rootMargin: "240px 0px"
      }
    );

    observer.observe(triggerElement);
    return () => {
      observer.disconnect();
    };
  }, [canUseIntersectionObserver, hasMore, isLoading, isLoadingMore, loadMore]);

  const searchOptionsToggleButton = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-expanded={isSearchOptionsOpen}
      aria-controls="entity-search-options"
      aria-label={isSearchOptionsOpen ? "検索条件を閉じる" : "検索条件を開く"}
      onClick={() => {
        if (isSearchOptionsOpen) {
          page.endQueryComposition();
        }
        setIsSearchOptionsOpen((current) => !current);
      }}
    >
      <ChevronDown
        className={`h-4 w-4 transition-transform ${isSearchOptionsOpen ? "rotate-180" : "rotate-0"}`}
        aria-hidden="true"
      />
    </Button>
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl items-start px-4 pb-4 pt-20">
      <section className="w-full space-y-3">
        <div className="relative rounded-lg border bg-card p-3">
          <div className="space-y-3 pb-10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">種別</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={page.selectedKindTab === "all" ? "default" : "outline"}
                  onClick={() => page.setSelectedKindTab("all")}
                >
                  すべて
                </Button>
                {page.kinds.map((kind) => (
                  <Button
                    key={kind.id}
                    size="sm"
                    variant={page.selectedKindTab === toKindTab(kind.id) ? "default" : "outline"}
                    onClick={() => page.setSelectedKindTab(toKindTab(kind.id))}
                  >
                    {kind.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant={page.selectedKindTab === "wishlist" ? "default" : "outline"}
                  onClick={() => page.setSelectedKindTab("wishlist")}
                >
                  気になる
                </Button>
              </div>
            </div>
            {isSearchOptionsOpen && (
              <div id="entity-search-options" className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="entity-search-input">キーワード</Label>
                    <Input
                      id="entity-search-input"
                      value={page.query}
                      onChange={(event) => page.setQuery(event.target.value)}
                      onCompositionStart={page.startQueryComposition}
                      onCompositionEnd={page.endQueryComposition}
                      onBlur={page.endQueryComposition}
                      placeholder="タイトル・本文・タグで検索"
                      autoComplete="off"
                    />
                  </div>
                  <div className="w-32 shrink-0 space-y-2">
                    <Select
                      id="entity-search-match"
                      aria-label="一致条件"
                      value={page.match}
                      onChange={(event) => page.setMatch(event.target.value as EntitySearchMatch)}
                    >
                      {Object.entries(ENTITY_SEARCH_MATCH_LABELS).map(([match, label]) => (
                        <option key={match} value={match}>
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
                    <Button
                      size="sm"
                      variant={page.isAllFieldsSelected ? "default" : "outline"}
                      onClick={() => page.setSelectedFields([...ENTITY_SEARCH_FIELDS])}
                    >
                      すべて
                    </Button>
                    {ENTITY_SEARCH_FIELDS.map((field) => {
                      const checked = !page.isAllFieldsSelected && selectedFieldSet.has(field);
                      return (
                        <Button
                          key={field}
                          size="sm"
                          variant={checked ? "default" : "outline"}
                          onClick={() => page.toggleField(field)}
                        >
                          {ENTITY_SEARCH_FIELD_LABELS[field]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="absolute bottom-2 right-2">{searchOptionsToggleButton}</div>
        </div>

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
          page.entities.map((entity) => {
            const kindLabel = entity.kind.label;
            return (
              <article
                key={entity.id}
                className="cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
                onClick={() =>
                  navigate({
                    pathname: getEntityDetailPath(entity.id),
                    search: location.search
                  })
                }
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">{entity.name}</h3>
                      {entity.isWishlist && (
                        <span className="rounded-full border px-2 py-0.5 text-xs">気になる</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">種別: {kindLabel}</p>
                    {entity.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entity.tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            className="rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
                            onClick={(event) => {
                              event.stopPropagation();
                              page.applyTagFilter(tag.name);
                            }}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {entity.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                        {entity.description}
                      </p>
                    )}
                  </div>
                  {entity.firstImageUrl && (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                      <img
                        src={entity.firstImageUrl}
                        alt={`${entity.name}の画像サムネイル`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}

        {page.hasMore && (
          <div className="flex justify-center">
            <div ref={canUseIntersectionObserver ? loadMoreTriggerRef : undefined}>
              {canUseIntersectionObserver ? (
                <p className="text-sm text-muted-foreground">
                  {page.isLoadingMore ? "読み込み中..." : "下へスクロールして続きを読み込む"}
                </p>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    void page.loadMore();
                  }}
                  disabled={page.isLoadingMore}
                >
                  {page.isLoadingMore ? "読み込み中..." : "もっと見る"}
                </Button>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
