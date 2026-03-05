import { describe, expect, it, vi } from "vitest";
import {
  countImageCleanupTasksInD1,
  deleteImageCleanupTaskFromD1,
  enqueueImageCleanupTaskToD1,
  listImageCleanupTasksFromD1,
  markImageCleanupTaskFailedInD1
} from "../../../src/modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";

describe("image-cleanup-task repository d1", () => {
  it("inserts or updates cleanup task with retry increment", async () => {
    const run = vi.fn(async () => ({ success: true }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await enqueueImageCleanupTaskToD1(
      db,
      "entities/e1/i1.png",
      "delete_failed",
      "r2 timeout"
    );

    expect(result).toBe("enqueued");
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(bind).toHaveBeenCalledWith("entities/e1/i1.png", "delete_failed", "r2 timeout");

    const sql = prepare.mock.calls[0]?.[0] as string;
    expect(sql).toContain("ON CONFLICT(object_key) DO UPDATE");
    expect(sql).toContain("retry_count = image_cleanup_tasks.retry_count + 1");
  });

  it("returns error when enqueue query execution fails", async () => {
    const run = vi.fn(async () => ({ success: false }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await enqueueImageCleanupTaskToD1(db, "k", "reason", null);

    expect(result).toBe("error");
  });

  it("lists cleanup tasks ordered by creation time", async () => {
    const all = vi.fn(async () => ({
      results: [
        {
          id: 1,
          object_key: "a",
          reason: "r",
          last_error: null,
          retry_count: 0,
          created_at: "2026-01-01",
          updated_at: "2026-01-01"
        }
      ]
    }));
    const bind = vi.fn(() => ({ all }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const tasks = await listImageCleanupTasksFromD1(db, 10);

    expect(tasks).toHaveLength(1);
    expect(bind).toHaveBeenCalledWith(10);
  });

  it("marks cleanup task as failed with retry increment", async () => {
    const run = vi.fn(async () => ({ success: true, meta: { changes: 1 } }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await markImageCleanupTaskFailedInD1(db, 99, "delete failed");

    expect(result).toBe("updated");
    expect(bind).toHaveBeenCalledWith("delete failed", 99);
  });

  it("returns not_found when mark target does not exist", async () => {
    const run = vi.fn(async () => ({ success: true, meta: { changes: 0 } }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await markImageCleanupTaskFailedInD1(db, 99, "delete failed");

    expect(result).toBe("not_found");
  });

  it("deletes cleanup task row", async () => {
    const run = vi.fn(async () => ({ success: true, meta: { changes: 1 } }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await deleteImageCleanupTaskFromD1(db, 7);

    expect(result).toBe("updated");
    expect(bind).toHaveBeenCalledWith(7);
  });

  it("returns not_found when delete target does not exist", async () => {
    const run = vi.fn(async () => ({ success: true, meta: { changes: 0 } }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await deleteImageCleanupTaskFromD1(db, 7);

    expect(result).toBe("not_found");
  });

  it("returns current cleanup queue size", async () => {
    const first = vi.fn(async () => ({ count: "12" }));
    const prepare = vi.fn(() => ({ first }));
    const db = { prepare } as unknown as D1Database;

    const count = await countImageCleanupTasksInD1(db);

    expect(count).toBe(12);
  });
});
