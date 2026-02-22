import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { createMaintenanceRoutes } from "../../../src/routes/api/maintenance-routes";
import { requestIdMiddleware } from "../../../src/shared/http/request-id";

vi.mock("../../../src/usecases/image-cleanup-usecase", () => ({
  runImageCleanupTasksUseCase: vi.fn()
}));

import { runImageCleanupTasksUseCase } from "../../../src/usecases/image-cleanup-usecase";

const runImageCleanupTasksUseCaseMock = vi.mocked(runImageCleanupTasksUseCase);

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

  it("runs cleanup with default limit when no query is provided", async () => {
    const app = createApp();
    runImageCleanupTasksUseCaseMock.mockResolvedValue({
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
    expect(runImageCleanupTasksUseCaseMock).toHaveBeenCalledWith(TEST_ENV.DB, TEST_ENV.ENTITY_IMAGES, 20);
  });
});
