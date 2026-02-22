import { describe, expect, it, vi } from "vitest";
import { enqueueImageCleanupTask } from "../../../src/repositories/image-cleanup-task-repository";

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
});
