import { useLocation, useNavigate } from "react-router-dom";
import { toKindTab } from "../model/entity-list";
import { useEntityListPage } from "../model/use-entity-list-page";
import { getEntityDetailPath } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";

export function EntityListPageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = useEntityListPage();

  if (page.isLoading) {
    return <main className="w-full bg-background pt-20" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl items-start px-4 pb-4 pt-20">
      <section className="w-full space-y-3">
        {page.error && <p className="text-sm text-destructive">{page.error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={page.selectedTab === "all" ? "default" : "outline"}
            onClick={() => page.setSelectedTab("all")}
          >
            すべて
          </Button>
          {page.kindTabs.map((kind) => {
            const kindTab = toKindTab(kind.id);
            return (
              <Button
                key={kind.id}
                size="sm"
                variant={page.selectedTab === kindTab ? "default" : "outline"}
                onClick={() => page.setSelectedTab(kindTab)}
              >
                {kind.label}
              </Button>
            );
          })}
          <Button
            size="sm"
            variant={page.selectedTab === "wishlist" ? "default" : "outline"}
            onClick={() => page.setSelectedTab("wishlist")}
          >
            気になる
          </Button>
        </div>
        {page.filteredEntities.length === 0 ? (
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            表示できる登録がありません。
          </div>
        ) : (
          page.filteredEntities.map((entity) => {
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
                          <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs">
                            {tag.name}
                          </span>
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
      </section>
    </main>
  );
}
