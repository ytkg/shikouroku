import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthGuard } from "@/features/auth";
import { useEntityQuery } from "@/features/entities";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { ApiError } from "@/shared/api/api-error";

export default function EntityDetailPage() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const ensureAuthorized = useAuthGuard();
  const { data: entity, error: queryError, isLoading } = useEntityQuery(entityId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) {
      setError("嗜好 ID が不正です");
      return;
    }

    if (!queryError) {
      setError(null);
      return;
    }

    if (queryError instanceof ApiError && !ensureAuthorized(queryError.status)) {
      return;
    }

    if (queryError instanceof ApiError && queryError.status === 404) {
      setError("データが見つかりませんでした");
      return;
    }

    setError(queryError instanceof Error ? queryError.message : "unknown error");
  }, [entityId, queryError, ensureAuthorized]);

  if (entityId && isLoading) {
    return <main className="w-full bg-background pt-20" />;
  }

  const kindLabel = entity?.kind.label ?? "不明";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{entity?.name ?? "嗜好 詳細"}</CardTitle>
          <CardDescription>{entity?.isWishlist ? "気になるに登録済み" : ""}</CardDescription>
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
                  <p className="text-xs text-muted-foreground">タグ</p>
                  {entity.tags.length === 0 ? (
                    <p className="text-sm">（タグなし）</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {entity.tags.map((tag) => (
                        <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="break-all text-xs">{entity.id}</p>
                </div>
              </>
            )
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => navigate(`/entities/${entityId}/edit`)}>編集</Button>
        </CardFooter>
      </Card>
      <Button variant="outline" onClick={() => navigate("/")}>
        一覧へ戻る
      </Button>
    </main>
  );
}
