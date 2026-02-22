import {
  countImageCleanupTasksInD1,
  deleteImageCleanupTaskFromD1,
  enqueueImageCleanupTaskToD1,
  listImageCleanupTasksFromD1,
  markImageCleanupTaskFailedInD1,
  type ImageCleanupTaskRecord
} from "../modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";

export async function enqueueImageCleanupTask(
  db: D1Database,
  objectKey: string,
  reason: string,
  lastError: string | null
): Promise<boolean> {
  return enqueueImageCleanupTaskToD1(db, objectKey, reason, lastError);
}

export type ImageCleanupTaskRow = ImageCleanupTaskRecord;

export async function listImageCleanupTasks(
  db: D1Database,
  limit: number
): Promise<ImageCleanupTaskRow[]> {
  return listImageCleanupTasksFromD1(db, limit);
}

export async function deleteImageCleanupTask(db: D1Database, id: number): Promise<boolean> {
  return deleteImageCleanupTaskFromD1(db, id);
}

export async function markImageCleanupTaskFailed(
  db: D1Database,
  id: number,
  lastError: string | null
): Promise<boolean> {
  return markImageCleanupTaskFailedInD1(db, id, lastError);
}

export async function countImageCleanupTasks(db: D1Database): Promise<number> {
  return countImageCleanupTasksInD1(db);
}
