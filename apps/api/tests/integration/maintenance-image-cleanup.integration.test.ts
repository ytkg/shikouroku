import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";

type CleanupTaskRecord = {
  id: number;
  object_key: string;
  reason: string;
  last_error: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
};

function createInMemoryCleanupDb(seed: CleanupTaskRecord[]): D1Database {
  let tasks = [...seed];

  function createStatement(sql: string, args: unknown[]) {
    return {
      all: async () => {
        if (sql.includes("FROM image_cleanup_tasks") && sql.includes("ORDER BY created_at ASC")) {
          const limit = Number(args[0] ?? 0);
          const sorted = [...tasks].sort(
            (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id
          );
          return {
            results: sorted.slice(0, limit)
          };
        }

        throw new Error(`unsupported all query: ${sql}`);
      },
      first: async () => {
        if (sql.includes("SELECT COUNT(*) AS count FROM image_cleanup_tasks")) {
          return {
            count: tasks.length
          };
        }

        throw new Error(`unsupported first query: ${sql}`);
      },
      run: async () => {
        if (sql.includes("DELETE FROM image_cleanup_tasks WHERE id = ?")) {
          const id = Number(args[0] ?? 0);
          const before = tasks.length;
          tasks = tasks.filter((task) => task.id !== id);
          return {
            success: true,
            meta: {
              changes: before - tasks.length
            }
          };
        }

        if (
          sql.includes("UPDATE image_cleanup_tasks") &&
          sql.includes("retry_count = retry_count + 1")
        ) {
          const lastError = (args[0] as string | null) ?? null;
          const id = Number(args[1] ?? 0);
          const target = tasks.find((task) => task.id === id);
          if (target) {
            target.retry_count += 1;
            target.last_error = lastError;
            target.updated_at = "2026-02-22T00:00:00.000Z";
          }

          return {
            success: true,
            meta: {
              changes: target ? 1 : 0
            }
          };
        }

        throw new Error(`unsupported run query: ${sql}`);
      }
    };
  }

  const prepare = (sql: string) => ({
    ...createStatement(sql, []),
    bind: (...args: unknown[]) => createStatement(sql, args)
  });

  return {
    prepare
  } as unknown as D1Database;
}

function createMockImageBucket(failingObjectKeys: Set<string>): R2Bucket {
  return {
    delete: vi.fn(async (objectKey: string) => {
      if (failingObjectKeys.has(objectKey)) {
        throw new Error("r2 unavailable");
      }
    })
  } as unknown as R2Bucket;
}

function createTestEnv(tasks: CleanupTaskRecord[]) {
  return {
    AUTH_BASE_URL: "https://auth.example.test",
    ASSETS: {
      fetch: async () => new Response("not found", { status: 404 })
    },
    DB: createInMemoryCleanupDb(tasks),
    ENTITY_IMAGES: createMockImageBucket(new Set(["entities/e2/i2.png"]))
  } as const;
}

describe("maintenance image cleanup integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs cleanup and keeps failed tasks in queue with incremented retry", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/verify")) {
        return new Response(null, { status: 200 });
      }

      return new Response(null, { status: 404 });
    });

    const env = createTestEnv([
      {
        id: 1,
        object_key: "entities/e1/i1.png",
        reason: "entity_image_delete_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-02-01T00:00:00.000Z",
        updated_at: "2026-02-01T00:00:00.000Z"
      },
      {
        id: 2,
        object_key: "entities/e2/i2.png",
        reason: "entity_image_delete_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-02-02T00:00:00.000Z",
        updated_at: "2026-02-02T00:00:00.000Z"
      },
      {
        id: 3,
        object_key: "entities/e3/i3.png",
        reason: "metadata_insert_failed",
        last_error: null,
        retry_count: 0,
        created_at: "2026-02-03T00:00:00.000Z",
        updated_at: "2026-02-03T00:00:00.000Z"
      }
    ]);

    const runResponse = await app.request(
      "http://localhost/api/maintenance/image-cleanup/run?limit=3",
      {
        method: "POST",
        headers: {
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );

    expect(runResponse.status).toBe(200);
    await expect(runResponse.json()).resolves.toMatchObject({
      ok: true,
      cleanup: {
        processed: 3,
        deleted: 2,
        failed: 1,
        remaining: 1
      }
    });

    const listResponse = await app.request(
      "http://localhost/api/maintenance/image-cleanup/tasks?limit=10",
      {
        method: "GET",
        headers: {
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toMatchObject({
      ok: true,
      cleanup: {
        total: 1,
        tasks: [
          {
            id: 2,
            object_key: "entities/e2/i2.png",
            retry_count: 1,
            last_error: "r2 unavailable"
          }
        ]
      }
    });
  });
});
