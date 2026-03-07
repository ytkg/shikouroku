import type { ImageFailureReason, ImageOperationStatus, ImageOperationType } from "../model/image-operation-status";

const failureReasonLabels: Record<ImageFailureReason, string> = {
  size: "サイズ超過",
  format: "形式不正",
  network: "通信失敗",
  other: "その他"
};
const operationLabels: Record<ImageOperationType, string> = {
  upload: "アップロード",
  retry: "再試行",
  delete: "削除",
  reorder: "並び替え保存"
};

type EntityImageOperationStatusCardProps = {
  operationStatus: ImageOperationStatus;
};

export function EntityImageOperationStatusCard({ operationStatus }: EntityImageOperationStatusCardProps) {
  if (operationStatus.operationStatus === "idle") {
    return null;
  }

  const summary = operationStatus.operationSummary;
  const reasons = new Map<ImageFailureReason, number>();
  for (const reason of summary?.failureReasons ?? []) {
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }

  return (
    <div aria-live="polite" className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
      <p className="font-medium">操作ステータス</p>
      {operationStatus.operationStatus === "processing" ? (
        <div className="mt-1 space-y-0.5 text-muted-foreground">
          <p>{operationLabels[summary?.lastOperation ?? "upload"]}を処理中...</p>
          <p>
            進捗: {(summary?.successCount ?? 0) + (summary?.failedCount ?? 0)} / {summary?.totalCount ?? 0}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1">
            完了: 成功 {summary?.successCount ?? 0}件 / 失敗 {summary?.failedCount ?? 0}件
          </p>
          {reasons.size > 0 && (
            <div className="mt-1">
              <p className="text-muted-foreground">失敗理由</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Array.from(reasons.entries()).map(([reason, count]) => (
                  <span key={reason} className="rounded-full border px-2 py-0.5 text-xs">
                    {failureReasonLabels[reason]}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
