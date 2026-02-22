import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { createMaintenanceRoutes } from "../../../src/routes/api/maintenance-routes";
import { requestIdMiddleware } from "../../../src/shared/http/request-id";

vi.mock("../../../src/modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query", () => ({
  listImageCleanupTasksQuery: vi.fn()
}));

vi.mock("../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command", () => ({
  runImageCleanupCommand: vi.fn()
}));

import {
  listImageCleanupTasksQuery
} from "../../../src/modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query";
import {
  runImageCleanupCommand
} from "../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command";

const runImageCleanupCommandMock = vi.mocked(runImageCleanupCommand);
const listImageCleanupTasksQueryMock = vi.mocked(listImageCleanupTasksQuery);

const TEST_ENV = {
  AUTH_BASE_URL: "https://auth.example.test",
  ASSETS: {
    fetch: async () => new Response("not found", { status: 404 })
  },
  DB: {},
  ENTITY_IMAGES: {}
} as any;

function createApp() {
  const app = new Hono<AppEnv>();
  app.use("*", requestIdMiddleware);
  app.route("/", createMaintenanceRoutes());
  return app;
}

describe("maintenance routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when limit is invalid", async () => {
    const app = createApp();
    const response = await app.request("http://localhost/maintenance/image-cleanup/run?limit=0", { method: "POST" }, TEST_ENV);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_CLEANUP_LIMIT"
      }
    });
  });

  it("lists cleanup tasks with default limit", async () => {
    const app = createApp();
    listImageCleanupTasksQueryMock.mockResolvedValue({
      ok: true,
      data: {
        tasks: [
          {
            id: 1,
            object_key: "entities/e1/i1.png",
            reason: "delete_failed",
            last_error: null,
            retry_count: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01"
          }
        ],
        total: 3
      }
    });

    const response = await app.request("http://localhost/maintenance/image-cleanup/tasks", { method: "GET" }, TEST_ENV);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      cleanup: {
        tasks: [
          {
            id: 1,
            object_key: "entities/e1/i1.png"
          }
        ],
        total: 3
      }
    });
    expect(listImageCleanupTasksQueryMock).toHaveBeenCalledWith(TEST_ENV.DB, 20);
  });

  it("runs cleanup with default limit when no query is provided", async () => {
    const app = createApp();
    runImageCleanupCommandMock.mockResolvedValue({
      ok: true,
      data: {
        processed: 3,
        deleted: 2,
        failed: 1,
        remaining: 5
      }
    });

    const response = await app.request("http://localhost/maintenance/image-cleanup/run", { method: "POST" }, TEST_ENV);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      cleanup: {
        processed: 3,
        deleted: 2,
        failed: 1,
        remaining: 5
      }
    });
    expect(runImageCleanupCommandMock).toHaveBeenCalledWith(TEST_ENV.DB, TEST_ENV.ENTITY_IMAGES, 20);
  });
});
