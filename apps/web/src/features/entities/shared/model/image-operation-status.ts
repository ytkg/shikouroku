import { ApiError } from "@/shared/api/api-error";

export type ImageOperationType = "upload" | "retry" | "delete" | "reorder";
export type ImageOperationStatusType = "idle" | "processing" | "completed" | "failed" | "partial";
export type ImageFailureReason = "size" | "format" | "network" | "other";

export type ImageOperationSummary = {
  successCount: number;
  failedCount: number;
  totalCount: number;
  lastOperation: ImageOperationType;
  failureReasons: ImageFailureReason[];
};

export type ImageOperationStatus = {
  operationStatus: ImageOperationStatusType;
  operationSummary: ImageOperationSummary | null;
};

export const idleImageOperationStatus: ImageOperationStatus = {
  operationStatus: "idle",
  operationSummary: null
};

type FinalizeImageOperationStatusInput = {
  lastOperation: ImageOperationType;
  successCount: number;
  failedCount: number;
  totalCount: number;
  failureReasons: ImageFailureReason[];
};

type ProcessingImageOperationStatusInput = {
  lastOperation: ImageOperationType;
  successCount: number;
  failedCount: number;
  totalCount: number;
};

export function createProcessingImageOperationStatus(
  lastOperation: ImageOperationType,
  totalCount: number
): ImageOperationStatus {
  return {
    operationStatus: "processing",
    operationSummary: {
      successCount: 0,
      failedCount: 0,
      totalCount,
      lastOperation,
      failureReasons: []
    }
  };
}

export function updateProcessingImageOperationStatus({
  lastOperation,
  successCount,
  failedCount,
  totalCount
}: ProcessingImageOperationStatusInput): ImageOperationStatus {
  return {
    operationStatus: "processing",
    operationSummary: {
      successCount,
      failedCount,
      totalCount,
      lastOperation,
      failureReasons: []
    }
  };
}

export function finalizeImageOperationStatus({
  lastOperation,
  successCount,
  failedCount,
  totalCount,
  failureReasons
}: FinalizeImageOperationStatusInput): ImageOperationStatus {
  if (failedCount === 0) {
    return {
      operationStatus: "completed",
      operationSummary: {
        successCount,
        failedCount,
        totalCount,
        lastOperation,
        failureReasons: []
      }
    };
  }

  return {
    operationStatus: successCount > 0 ? "partial" : "failed",
    operationSummary: {
      successCount,
      failedCount,
      totalCount,
      lastOperation,
      failureReasons
    }
  };
}

export function classifyImageFailureReason(error: unknown): ImageFailureReason {
  if (error instanceof TypeError) {
    return "network";
  }

  if (error instanceof ApiError) {
    if (error.status === 413) {
      return "size";
    }
    if (error.status === 415) {
      return "format";
    }
    if (error.status >= 500) {
      return "network";
    }
  }

  const lowered = `${error instanceof Error ? error.message : String(error)}`.toLowerCase();
  if (
    lowered.includes("too large") ||
    lowered.includes("size") ||
    lowered.includes("payload") ||
    lowered.includes("413")
  ) {
    return "size";
  }
  if (
    lowered.includes("mime") ||
    lowered.includes("format") ||
    lowered.includes("unsupported") ||
    lowered.includes("type") ||
    lowered.includes("415")
  ) {
    return "format";
  }
  if (
    lowered.includes("network") ||
    lowered.includes("fetch") ||
    lowered.includes("timeout") ||
    lowered.includes("connection") ||
    lowered.includes("通信")
  ) {
    return "network";
  }
  return "other";
}
