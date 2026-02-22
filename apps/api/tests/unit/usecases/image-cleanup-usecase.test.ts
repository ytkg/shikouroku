import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/repositories/image-cleanup-task-repository", () => ({
  countImageCleanupTasks: vi.fn(),
  deleteImageCleanupTask: vi.fn(),
  listImageCleanupTasks: vi.fn(),
  markImageCleanupTaskFailed: vi.fn()
}));

import {
  countImageCleanupTasks,
  deleteImageCleanupTask,
  listImageCleanupTasks,
  markImageCleanupTaskFailed
} from "../../../src/repositories/image-cleanup-task-repository";
import { runImageCleanupTasksUseCase } from "../../../src/usecases/image-cleanup-usecase";

const listImageCleanupTasksMock = vi.mocked(listImageCleanupTasks);
const deleteImageCleanupTaskMock = vi.mocked(deleteImageCleanupTask);
const markImageCleanupTaskFailedMock = vi.mocked(markImageCleanupTaskFailed);
const countImageCleanupTasksMock = vi.mocked(countImageCleanupTasks);

function createMockImageBucket() {
  return {
    delete: vi.fn(async () => undefined)
  } as unknown as R2Bucket;
}

describe("runImageCleanupTasksUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes cleanup tasks when R2 deletion succeeds", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket() as unknown as { delete: ReturnType<typeof vi.fn> };
    listImageCleanupTasksMock.mockResolvedValue([
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
    deleteImageCleanupTaskMock.mockResolvedValue(true);
    countImageCleanupTasksMock.mockResolvedValue(3);

    const result = await runImageCleanupTasksUseCase(db, imageBucket as unknown as R2Bucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 1,
        failed: 0,
        remaining: 3
      }
    });
    expect(deleteImageCleanupTaskMock).toHaveBeenCalledWith(db, 1);
    expect(imageBucket.delete).toHaveBeenCalledWith("entities/e1/i1.png");
  });

  it("marks task as failed when R2 deletion fails", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket() as unknown as { delete: ReturnType<typeof vi.fn> };
    imageBucket.delete.mockRejectedValue(new Error("r2 timeout"));
    listImageCleanupTasksMock.mockResolvedValue([
      {
        id: 10,
        object_key: "entities/e1/i10.png",
        reason: "delete_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ]);
    markImageCleanupTaskFailedMock.mockResolvedValue(true);
    countImageCleanupTasksMock.mockResolvedValue(1);

    const result = await runImageCleanupTasksUseCase(db, imageBucket as unknown as R2Bucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 0,
        failed: 1,
        remaining: 1
      }
    });
    expect(markImageCleanupTaskFailedMock).toHaveBeenCalledWith(db, 10, "r2 timeout");
  });

  it("returns failure when task finalization fails", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket();
    listImageCleanupTasksMock.mockResolvedValue([
      {
        id: 7,
        object_key: "entities/e1/i7.png",
        reason: "delete_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ]);
    deleteImageCleanupTaskMock.mockResolvedValue(false);

    const result = await runImageCleanupTasksUseCase(db, imageBucket, 10);

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "failed to finalize cleanup task"
    });
  });
});
