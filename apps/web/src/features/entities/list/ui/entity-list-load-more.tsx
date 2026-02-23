import type { RefObject } from "react";
import { Button } from "@/shared/ui/button";

type EntityListLoadMoreProps = {
  canUseIntersectionObserver: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void>;
  triggerRef?: RefObject<HTMLDivElement>;
};

export function EntityListLoadMore({
  canUseIntersectionObserver,
  isLoadingMore,
  onLoadMore,
  triggerRef
}: EntityListLoadMoreProps) {
  return (
    <div className="flex justify-center">
      <div ref={canUseIntersectionObserver ? triggerRef : undefined}>
        {canUseIntersectionObserver ? (
          <p className="text-sm text-muted-foreground">{isLoadingMore ? "読み込み中..." : "下へスクロールして続きを読み込む"}</p>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              void onLoadMore();
            }}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "読み込み中..." : "もっと見る"}
          </Button>
        )}
      </div>
    </div>
  );
}
