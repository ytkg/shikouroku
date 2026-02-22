export type ImageCleanupTaskRepository = {
  listTasks: (limit: number) => Promise<ImageCleanupTaskRecord[]>;
  deleteTask: (id: number) => Promise<boolean>;
  markTaskFailed: (id: number, lastError: string | null) => Promise<boolean>;
  countTasks: () => Promise<number>;
  enqueueTask: (objectKey: string, reason: string, lastError: string | null) => Promise<boolean>;
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
