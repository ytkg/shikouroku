import { listImageCleanupTasksQuery } from "../modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query";
import { runImageCleanupCommand } from "../modules/maintenance/image-cleanup/application/run-image-cleanup-command";
import type { ImageCleanupTaskRecord } from "../modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";
import type { UseCaseResult } from "./result";

export async function runImageCleanupTasksUseCase(
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
  return runImageCleanupCommand(db, imageBucket, limit);
}

export async function listImageCleanupTasksUseCase(
  db: D1Database,
  limit: number
): Promise<UseCaseResult<{ tasks: ImageCleanupTaskRecord[]; total: number }>> {
  return listImageCleanupTasksQuery(db, limit);
}
