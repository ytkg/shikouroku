export type ImageCleanupTaskRepository = {
  enqueueTask: (objectKey: string, reason: string, lastError: string | null) => Promise<boolean>;
};
