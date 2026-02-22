import { describe, expect, it, vi } from "vitest";
import {
  countImageCleanupTasks,
  deleteImageCleanupTask,
  enqueueImageCleanupTask,
  listImageCleanupTasks,
  markImageCleanupTaskFailed
} from "../../../src/repositories/image-cleanup-task-repository";

describe("enqueueImageCleanupTask", () => {
  it("inserts or updates cleanup task with retry increment", async () => {
    const run = vi.fn(async () => ({ success: true }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const ok = await enqueueImageCleanupTask(db, "entities/e1/i1.png", "delete_failed", "r2 timeout");

    expect(ok).toBe(true);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(bind).toHaveBeenCalledWith("entities/e1/i1.png", "delete_failed", "r2 timeout");

    const sql = prepare.mock.calls[0]?.[0] as string;
    expect(sql).toContain("ON CONFLICT(object_key) DO UPDATE");
    expect(sql).toContain("retry_count = image_cleanup_tasks.retry_count + 1");
  });

  it("returns false when query execution fails", async () => {
    const run = vi.fn(async () => ({ success: false }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const ok = await enqueueImageCleanupTask(db, "k", "reason", null);

    expect(ok).toBe(false);
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

    const tasks = await listImageCleanupTasks(db, 10);

    expect(tasks).toHaveLength(1);
    expect(bind).toHaveBeenCalledWith(10);
  });

  it("marks cleanup task as failed with retry increment", async () => {
    const run = vi.fn(async () => ({ success: true }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const ok = await markImageCleanupTaskFailed(db, 99, "delete failed");

    expect(ok).toBe(true);
    expect(bind).toHaveBeenCalledWith("delete failed", 99);
  });

  it("deletes cleanup task row", async () => {
    const run = vi.fn(async () => ({ success: true }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const ok = await deleteImageCleanupTask(db, 7);

    expect(ok).toBe(true);
    expect(bind).toHaveBeenCalledWith(7);
  });

  it("returns current cleanup queue size", async () => {
    const first = vi.fn(async () => ({ count: "12" }));
    const prepare = vi.fn(() => ({ first }));
    const db = { prepare } as unknown as D1Database;

    const count = await countImageCleanupTasks(db);

    expect(count).toBe(12);
  });
});
