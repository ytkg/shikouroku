import type {
  ImageCleanupTaskRecord,
  ImageCleanupTaskRepository
} from "../ports/image-cleanup-task-repository";
import { success, type UseCaseResult } from "../../../../shared/application/result";

export async function listImageCleanupTasksQuery(
  imageCleanupTaskRepository: Pick<ImageCleanupTaskRepository, "listTasks" | "countTasks">,
  limit: number
): Promise<UseCaseResult<{ tasks: ImageCleanupTaskRecord[]; total: number }>> {
  const [tasks, total] = await Promise.all([
    imageCleanupTaskRepository.listTasks(limit),
    imageCleanupTaskRepository.countTasks()
  ]);

  return success({
    tasks,
    total
  });
}
