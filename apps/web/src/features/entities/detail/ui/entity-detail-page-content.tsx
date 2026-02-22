import { useNavigate, useParams } from "react-router-dom";
import { useEntityDetailPage } from "../model/use-entity-detail-page";
import {
  getEntityDetailPath,
  getEntityEditPath,
  routePaths
} from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function EntityDetailPageContent() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const page = useEntityDetailPage(entityId);
  const editPath = entityId ? getEntityEditPath(entityId) : routePaths.home;

  if (entityId && page.isLoading) {
    return <main className="w-full bg-background pt-20" />;
  }

  const kindLabel = page.entity?.kind.label ?? "不明";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{page.entity?.name ?? "嗜好 詳細"}</CardTitle>
          <CardDescription>{page.entity?.isWishlist ? "気になるに登録済み" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {page.error ? (
            <p className="text-sm text-destructive">{page.error}</p>
          ) : (
            page.entity && (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="break-all text-xs">{page.entity.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">種別</p>
                  <p className="text-sm">{kindLabel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">メモ</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {page.entity.description && page.entity.description.length > 0
                      ? page.entity.description
                      : "（メモなし）"}
                  </p>
                </div>
                {page.entity.tags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">タグ</p>
                    <div className="flex flex-wrap gap-2">
                      {page.entity.tags.map((tag) => (
                        <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(page.relatedLoading || page.relatedEntities.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">関連嗜好</p>
                    {page.relatedLoading ? (
                      <p className="text-sm">読み込み中...</p>
                    ) : (
                    <div className="space-y-2">
                      {page.relatedEntities.map((relatedEntity) => (
                        <div key={relatedEntity.id} className="rounded-md border px-3 py-2">
                          <button
                            type="button"
                            className="text-left text-sm hover:underline"
                            onClick={() => navigate(getEntityDetailPath(relatedEntity.id))}
                          >
                            {relatedEntity.name}（{relatedEntity.kind.label}）
                          </button>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}
              </>
            )
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => navigate(editPath)}>編集</Button>
        </CardFooter>
      </Card>
      <Button variant="outline" onClick={() => navigate(routePaths.home)}>
        一覧へ戻る
      </Button>
    </main>
  );
}
