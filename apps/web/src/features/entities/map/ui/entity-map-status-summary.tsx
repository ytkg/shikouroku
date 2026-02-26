type EntityMapStatusSummaryProps = {
  totalCount: number;
  visibleCount: number;
  isLoading: boolean;
};

export function EntityMapStatusSummary({ totalCount, visibleCount, isLoading }: EntityMapStatusSummaryProps) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>総件数 {totalCount} 件 / 表示中 {visibleCount} 件</p>
      <p>{isLoading ? "検索中..." : ""}</p>
    </div>
  );
}
