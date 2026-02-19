import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { ApiError, fetchEntities, fetchKinds } from "@/features/entities/api/entities-api";
import type { Entity, Kind } from "@/features/entities/model/entity-types";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

type EntityTab = "all" | "wishlist" | `kind:${number}`;

function toKindTab(kindId: number): `kind:${number}` {
  return `kind:${kindId}`;
}

function getVisibleEntities(entities: Entity[], selectedTab: EntityTab): Entity[] {
  if (selectedTab === "wishlist") {
    return entities.filter((entity) => entity.isWishlist);
  }

  const nonWishlistEntities = entities.filter((entity) => !entity.isWishlist);
  if (selectedTab === "all") {
    return nonWishlistEntities;
  }

  const kindId = Number(selectedTab.slice("kind:".length));
  return nonWishlistEntities.filter((entity) => entity.kindId === kindId);
}

export default function HomePage() {
  const navigate = useNavigate();
  const ensureAuthorized = useAuthGuard();
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedTab, setSelectedTab] = useState<EntityTab>("all");

  const loadKinds = async () => {
    try {
      const kindsData = await fetchKinds();
      setKinds(kindsData);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      throw e;
    }
  };

  const loadEntities = async () => {
    try {
      const entitiesData = await fetchEntities();
      setEntities(entitiesData);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      throw e;
    }
  };

  useEffect(() => {
    const init = async () => {
      setError(null);
      try {
        await Promise.all([loadKinds(), loadEntities()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown error");
      } finally {
        setCheckingAuth(false);
      }
    };

    void init();
  }, []);

  const filteredEntities = useMemo(
    () => getVisibleEntities(entities, selectedTab),
    [entities, selectedTab]
  );

  if (checkingAuth) {
    return <main className="w-full bg-background pt-20" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl items-start px-4 pb-10 pt-24">
      <section className="w-full space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedTab === "all" ? "default" : "outline"}
            onClick={() => setSelectedTab("all")}
          >
            すべて
          </Button>
          {kinds.map((kind) => {
            const kindTab = toKindTab(kind.id);
            return (
              <Button
                key={kind.id}
                size="sm"
                variant={selectedTab === kindTab ? "default" : "outline"}
                onClick={() => setSelectedTab(kindTab)}
              >
                {kind.label}
              </Button>
            );
          })}
          <Button
            size="sm"
            variant={selectedTab === "wishlist" ? "default" : "outline"}
            onClick={() => setSelectedTab("wishlist")}
          >
            気になる
          </Button>
        </div>
        {filteredEntities.length === 0 ? (
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            表示できる登録がありません。
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const kindLabel = kinds.find((kind) => kind.id === entity.kindId)?.label ?? "不明";
            return (
              <article
                key={entity.id}
                className="cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
                onClick={() => navigate(`/entities/${entity.id}`)}
              >
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
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{entity.description}</p>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
