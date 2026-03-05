export type ImageCleanupTaskEnqueueResult = "enqueued" | "error";
export type ImageCleanupTaskMutationResult = "updated" | "not_found" | "error";

export type ImageCleanupTaskRepository = {
  listTasks: (limit: number) => Promise<ImageCleanupTaskRecord[]>;
  deleteTask: (id: number) => Promise<ImageCleanupTaskMutationResult>;
  markTaskFailed: (id: number, lastError: string | null) => Promise<ImageCleanupTaskMutationResult>;
  countTasks: () => Promise<number>;
  enqueueTask: (
    objectKey: string,
    reason: string,
    lastError: string | null
  ) => Promise<ImageCleanupTaskEnqueueResult>;
};

export type ImageCleanupTaskRecord = {
  id: number;
  object_key: string;
  reason: string;
  last_error: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
};
