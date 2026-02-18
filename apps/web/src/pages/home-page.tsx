import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { ApiError, fetchEntities, fetchKinds } from "@/features/entities/api/entities-api";
import type { Entity, Kind } from "@/features/entities/model/entity-types";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

export default function HomePage() {
  const navigate = useNavigate();
  const ensureAuthorized = useAuthGuard();
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedKindId, setSelectedKindId] = useState<number | "all">("all");

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

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    navigate("/login", { replace: true });
  };

  const filteredEntities =
    selectedKindId === "all"
      ? entities
      : entities.filter((entity) => entity.kind_id === selectedKindId);

  if (checkingAuth) {
    return <main className="min-h-screen bg-background pt-20" />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-4 pb-10 pt-24">
      <section className="w-full space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedKindId === "all" ? "default" : "outline"}
            onClick={() => setSelectedKindId("all")}
          >
            すべて
          </Button>
          {kinds.map((kind) => (
            <Button
              key={kind.id}
              size="sm"
              variant={selectedKindId === kind.id ? "default" : "outline"}
              onClick={() => setSelectedKindId(kind.id)}
            >
              {kind.label}
            </Button>
          ))}
        </div>
        {filteredEntities.length === 0 ? (
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            表示できる登録がありません。
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const kindLabel = kinds.find((kind) => kind.id === entity.kind_id)?.label ?? "不明";
            return (
              <article
                key={entity.id}
                className="cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
                onClick={() => navigate(`/entities/${entity.id}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{entity.name}</h3>
                  {entity.is_wishlist === 1 && (
                    <span className="rounded-full border px-2 py-0.5 text-xs">気になる</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">種別: {kindLabel}</p>
                {entity.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{entity.description}</p>
                )}
              </article>
            );
          })
        )}
        <div className="pt-2">
          <Button variant="secondary" onClick={logout}>
            ログアウト
          </Button>
        </div>
      </section>
    </main>
  );
}
