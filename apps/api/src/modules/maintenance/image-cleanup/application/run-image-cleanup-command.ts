import type { ImageCleanupTaskRepository } from "../ports/image-cleanup-task-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";

function toErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export async function runImageCleanupCommand(
  imageCleanupTaskRepository: Pick<
    ImageCleanupTaskRepository,
    "listTasks" | "deleteTask" | "markTaskFailed" | "countTasks"
  >,
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
  const tasks = await imageCleanupTaskRepository.listTasks(limit);
  let deleted = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      await imageBucket.delete(task.object_key);
      const removed = await imageCleanupTaskRepository.deleteTask(task.id);
      if (!removed) {
        return fail(500, "failed to finalize cleanup task");
      }
      deleted += 1;
    } catch (error) {
      const marked = await imageCleanupTaskRepository.markTaskFailed(task.id, toErrorMessage(error));
      if (!marked) {
        return fail(500, "failed to update image cleanup task");
      }
      failed += 1;
    }
  }

  const remaining = await imageCleanupTaskRepository.countTasks();
  return success({
    processed: tasks.length,
    deleted,
    failed,
    remaining
  });
}
