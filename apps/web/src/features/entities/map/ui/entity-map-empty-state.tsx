import { Link } from "react-router-dom";
import { routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";
import { EntityMapLocationListSkeleton } from "./entity-map-location-list-skeleton";

type EntityMapEmptyStateProps = {
  hasAnyLocation: boolean;
  isLoading: boolean;
  onResetFilters: () => void;
};

export function EntityMapEmptyState({ hasAnyLocation, isLoading, onResetFilters }: EntityMapEmptyStateProps) {
  if (isLoading) {
    return (
      <div aria-label="地図一覧を読み込み中">
        <EntityMapLocationListSkeleton />
      </div>
    );
  }

  if (!hasAnyLocation) {
    return (
      <div className="h-full overflow-y-auto space-y-2 rounded-md border border-border/70 bg-muted p-3 text-sm text-muted-foreground">
        <p>位置情報付きの嗜好がまだありません。</p>
        <Button asChild size="sm">
          <Link to={routePaths.newEntity}>新規登録</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 rounded-md border border-border/70 bg-muted p-3 text-sm text-muted-foreground">
      <p>条件に一致する嗜好がありません。</p>
      <Button type="button" size="sm" variant="outline" onClick={onResetFilters}>
        絞り込みをリセット
      </Button>
    </div>
  );
}
