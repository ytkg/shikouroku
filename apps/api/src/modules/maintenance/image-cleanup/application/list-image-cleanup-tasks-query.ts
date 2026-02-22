import {
  countImageCleanupTasksInD1,
  listImageCleanupTasksFromD1,
  type ImageCleanupTaskRecord
} from "../infra/image-cleanup-task-repository-d1";
import { success, type UseCaseResult } from "../../../../shared/application/result";

export async function listImageCleanupTasksQuery(
  db: D1Database,
  limit: number
): Promise<UseCaseResult<{ tasks: ImageCleanupTaskRecord[]; total: number }>> {
  const [tasks, total] = await Promise.all([
    listImageCleanupTasksFromD1(db, limit),
    countImageCleanupTasksInD1(db)
  ]);

  return success({
    tasks,
    total
  });
}
