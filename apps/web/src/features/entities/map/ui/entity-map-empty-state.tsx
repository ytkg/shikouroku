type EntityMapEmptyStateProps = {
  hasAnyLocation: boolean;
};

export function EntityMapEmptyState({ hasAnyLocation }: EntityMapEmptyStateProps) {
  if (!hasAnyLocation) {
    return (
      <div className="h-full overflow-y-auto rounded-md border border-border/70 bg-muted p-3 text-sm text-muted-foreground">
        位置情報付きの嗜好がまだありません。
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 rounded-md border border-border/70 bg-muted p-3 text-sm text-muted-foreground">
      <p>条件に一致する嗜好がありません。</p>
    </div>
  );
}
