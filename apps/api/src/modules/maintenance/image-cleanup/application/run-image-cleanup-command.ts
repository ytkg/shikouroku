import {
  countImageCleanupTasksInD1,
  deleteImageCleanupTaskFromD1,
  listImageCleanupTasksFromD1,
  markImageCleanupTaskFailedInD1
} from "../infra/image-cleanup-task-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";

function toErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export async function runImageCleanupCommand(
  db: D1Database,
  imageBucket: R2Bucket,
  limit: number
): Promise<
  UseCaseResult<{
    processed: number;
    deleted: number;
    failed: number;
    remaining: number;
  }>
> {
  const tasks = await listImageCleanupTasksFromD1(db, limit);
  let deleted = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      await imageBucket.delete(task.object_key);
      const removed = await deleteImageCleanupTaskFromD1(db, task.id);
      if (!removed) {
        return fail(500, "failed to finalize cleanup task");
      }
      deleted += 1;
    } catch (error) {
      const marked = await markImageCleanupTaskFailedInD1(db, task.id, toErrorMessage(error));
      if (!marked) {
        return fail(500, "failed to update image cleanup task");
      }
      failed += 1;
    }
  }

  const remaining = await countImageCleanupTasksInD1(db);
  return success({
    processed: tasks.length,
    deleted,
    failed,
    remaining
  });
}
