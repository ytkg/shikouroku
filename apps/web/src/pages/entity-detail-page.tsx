import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { ApiError, fetchEntityById, fetchKinds } from "@/features/entities/api/entities-api";
import type { Entity, Kind } from "@/features/entities/model/entity-types";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

export default function EntityDetailPage() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const ensureAuthorized = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [kinds, setKinds] = useState<Kind[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!entityId) {
        setError("entity id が不正です");
        setLoading(false);
        return;
      }

      setError(null);
      try {
        const [entityData, kindsData] = await Promise.all([fetchEntityById(entityId), fetchKinds()]);
        setEntity(entityData);
        setKinds(kindsData);
      } catch (e) {
        if (e instanceof ApiError && !ensureAuthorized(e.status)) {
          return;
        }
        if (e instanceof ApiError && e.status === 404) {
          setError("データが見つかりませんでした");
        } else {
          setError(e instanceof Error ? e.message : "unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [entityId]);

  if (loading) {
    return <main className="min-h-screen bg-background pt-20" />;
  }

  const kindLabel = entity ? kinds.find((kind) => kind.id === entity.kind_id)?.label ?? "不明" : "-";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{entity?.name ?? "Entity Detail"}</CardTitle>
          <CardDescription>{entity?.is_wishlist === 1 ? "気になるに登録済み" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            entity && (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">種別</p>
                  <p className="text-sm">{kindLabel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">メモ</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {entity.description && entity.description.length > 0
                      ? entity.description
                      : "（メモなし）"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="break-all text-xs">{entity.id}</p>
                </div>
              </>
            )
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate("/")}>
            一覧へ戻る
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
