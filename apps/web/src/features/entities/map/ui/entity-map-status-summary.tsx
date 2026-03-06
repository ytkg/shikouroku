type EntityMapStatusSummaryProps = {
  totalCount: number;
  visibleCount: number;
  isLoading: boolean;
  selectedEntityName: string | null;
};

export function EntityMapStatusSummary({
  totalCount,
  visibleCount,
  isLoading,
  selectedEntityName
}: EntityMapStatusSummaryProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <div className="space-y-0.5">
        <p>総件数 {totalCount} 件 / 表示中 {visibleCount} 件</p>
        {selectedEntityName && <p className="font-medium text-foreground">選択中: {selectedEntityName}</p>}
      </div>
      <p>{isLoading ? "検索中..." : ""}</p>
    </div>
  );
}
