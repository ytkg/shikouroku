import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1", () => ({
  countImageCleanupTasksInD1: vi.fn(),
  deleteImageCleanupTaskFromD1: vi.fn(),
  listImageCleanupTasksFromD1: vi.fn(),
  markImageCleanupTaskFailedInD1: vi.fn()
}));

import {
  countImageCleanupTasksInD1,
  deleteImageCleanupTaskFromD1,
  listImageCleanupTasksFromD1,
  markImageCleanupTaskFailedInD1
} from "../../../../../../src/modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";
import { listImageCleanupTasksQuery } from "../../../../../../src/modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query";
import { runImageCleanupCommand } from "../../../../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command";

const listImageCleanupTasksFromD1Mock = vi.mocked(listImageCleanupTasksFromD1);
const deleteImageCleanupTaskFromD1Mock = vi.mocked(deleteImageCleanupTaskFromD1);
const markImageCleanupTaskFailedInD1Mock = vi.mocked(markImageCleanupTaskFailedInD1);
const countImageCleanupTasksInD1Mock = vi.mocked(countImageCleanupTasksInD1);

function createMockImageBucket() {
  return {
    delete: vi.fn(async () => undefined)
  } as unknown as R2Bucket;
}

describe("maintenance image cleanup module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runImageCleanupCommand deletes queued object and task", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket() as unknown as { delete: ReturnType<typeof vi.fn> };

    listImageCleanupTasksFromD1Mock.mockResolvedValue([
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
    deleteImageCleanupTaskFromD1Mock.mockResolvedValue(true);
    countImageCleanupTasksInD1Mock.mockResolvedValue(0);

    const result = await runImageCleanupCommand(db, imageBucket as unknown as R2Bucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 1,
        failed: 0,
        remaining: 0
      }
    });
    expect(deleteImageCleanupTaskFromD1Mock).toHaveBeenCalledWith(db, 1);
  });

  it("runImageCleanupCommand marks task failed when delete throws", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket() as unknown as { delete: ReturnType<typeof vi.fn> };
    imageBucket.delete.mockRejectedValue(new Error("r2 timeout"));

    listImageCleanupTasksFromD1Mock.mockResolvedValue([
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
    markImageCleanupTaskFailedInD1Mock.mockResolvedValue(true);
    countImageCleanupTasksInD1Mock.mockResolvedValue(1);

    const result = await runImageCleanupCommand(db, imageBucket as unknown as R2Bucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 0,
        failed: 1,
        remaining: 1
      }
    });
    expect(markImageCleanupTaskFailedInD1Mock).toHaveBeenCalledWith(db, 2, "r2 timeout");
  });

  it("listImageCleanupTasksQuery returns tasks and total", async () => {
    const db = {} as D1Database;
    listImageCleanupTasksFromD1Mock.mockResolvedValue([
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
    countImageCleanupTasksInD1Mock.mockResolvedValue(9);

    const result = await listImageCleanupTasksQuery(db, 20);

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
