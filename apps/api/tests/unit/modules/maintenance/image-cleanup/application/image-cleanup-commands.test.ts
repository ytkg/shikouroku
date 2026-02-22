import { beforeEach, describe, expect, it, vi } from "vitest";
import { listImageCleanupTasksQuery } from "../../../../../../src/modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query";
import { runImageCleanupCommand } from "../../../../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command";
import type { ImageCleanupTaskRepository } from "../../../../../../src/modules/maintenance/image-cleanup/ports/image-cleanup-task-repository";

function createMockImageBucket() {
  return {
    delete: vi.fn(async () => undefined)
  } as unknown as R2Bucket;
}

describe("maintenance image cleanup module", () => {
  const listTasksMock = vi.fn();
  const deleteTaskMock = vi.fn();
  const markTaskFailedMock = vi.fn();
  const countTasksMock = vi.fn();
  const imageCleanupTaskRepository: ImageCleanupTaskRepository = {
    listTasks: listTasksMock,
    deleteTask: deleteTaskMock,
    markTaskFailed: markTaskFailedMock,
    countTasks: countTasksMock,
    enqueueTask: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runImageCleanupCommand deletes queued object and task", async () => {
    const imageBucket = createMockImageBucket() as unknown as { delete: ReturnType<typeof vi.fn> };

    listTasksMock.mockResolvedValue([
      {
        id: 1,
        object_key: "entities/e1/i1.png",
        reason: "delete_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ]);
    deleteTaskMock.mockResolvedValue(true);
    countTasksMock.mockResolvedValue(0);

    const result = await runImageCleanupCommand(imageCleanupTaskRepository, imageBucket as unknown as R2Bucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 1,
        failed: 0,
        remaining: 0
      }
    });
    expect(deleteTaskMock).toHaveBeenCalledWith(1);
  });

  it("runImageCleanupCommand marks task failed when delete throws", async () => {
    const imageBucket = createMockImageBucket() as unknown as { delete: ReturnType<typeof vi.fn> };
    imageBucket.delete.mockRejectedValue(new Error("r2 timeout"));

    listTasksMock.mockResolvedValue([
      {
        id: 2,
        object_key: "entities/e1/i2.png",
        reason: "delete_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ]);
    markTaskFailedMock.mockResolvedValue(true);
    countTasksMock.mockResolvedValue(1);

    const result = await runImageCleanupCommand(imageCleanupTaskRepository, imageBucket as unknown as R2Bucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 0,
        failed: 1,
        remaining: 1
      }
    });
    expect(markTaskFailedMock).toHaveBeenCalledWith(2, "r2 timeout");
  });

  it("listImageCleanupTasksQuery returns tasks and total", async () => {
    listTasksMock.mockResolvedValue([
      {
        id: 7,
        object_key: "entities/e1/i7.png",
        reason: "delete_failed",
        last_error: "r2 timeout",
        retry_count: 2,
        created_at: "2026-01-01",
        updated_at: "2026-01-02"
      }
    ]);
    countTasksMock.mockResolvedValue(9);

    const result = await listImageCleanupTasksQuery(imageCleanupTaskRepository, 20);

    expect(result).toEqual({
      ok: true,
      data: {
        tasks: [
          {
            id: 7,
            object_key: "entities/e1/i7.png",
            reason: "delete_failed",
            last_error: "r2 timeout",
            retry_count: 2,
            created_at: "2026-01-01",
            updated_at: "2026-01-02"
          }
        ],
        total: 9
      }
    });
  });
});
