import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { createEntityRoutes } from "../../../src/routes/api/entity-routes";
import { requestIdMiddleware } from "../../../src/shared/http/request-id";

vi.mock("../../../src/modules/catalog/entity/application/list-entities-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/modules/catalog/entity/application/list-entities-query")>();
  return {
    ...actual,
    listEntitiesQuery: vi.fn()
  };
});

vi.mock("../../../src/modules/catalog/image/application/upload-entity-image-command", () => ({
  uploadEntityImageCommand: vi.fn()
}));

vi.mock("../../../src/modules/catalog/entity/infra/entity-repository-d1", () => ({
  createD1EntityReadRepository: vi.fn(() => ({ mocked: true }))
}));

vi.mock("../../../src/modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1", () => ({
  createD1ImageCleanupTaskRepository: vi.fn(() => ({ mocked: true }))
}));

import {
  listEntitiesQuery
} from "../../../src/modules/catalog/entity/application/list-entities-query";
import {
  uploadEntityImageCommand
} from "../../../src/modules/catalog/image/application/upload-entity-image-command";

const listEntitiesQueryMock = vi.mocked(listEntitiesQuery);
const uploadEntityImageCommandMock = vi.mocked(uploadEntityImageCommand);

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
  app.route("/", createEntityRoutes());
  return app;
}

describe("entity routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when entity list query is invalid", async () => {
    const app = createApp();
    const response = await app.request("http://localhost/entities?limit=0", { method: "GET" }, TEST_ENV);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_ENTITY_LIMIT"
      }
    });
    expect(listEntitiesQueryMock).not.toHaveBeenCalled();
  });

  it("returns entities list on valid query", async () => {
    const app = createApp();
    listEntitiesQueryMock.mockResolvedValue({
      ok: true,
      data: {
        entities: [
          {
            id: "entity-1",
            kind: { id: 1, label: "book" },
            name: "Clean Code",
            description: null,
            is_wishlist: 0,
            first_image_url: null,
            tags: [],
            created_at: "2026-01-01",
            updated_at: "2026-01-02"
          }
        ],
        page: {
          limit: 20,
          total: 1,
          hasMore: false,
          nextCursor: null
        }
      }
    });

    const response = await app.request("http://localhost/entities", { method: "GET" }, TEST_ENV);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      entities: [{ id: "entity-1", name: "Clean Code" }],
      page: { total: 1 }
    });
    expect(listEntitiesQueryMock).toHaveBeenCalledWith(TEST_ENV.DB, expect.objectContaining({ limit: 20 }));
  });

  it("returns 400 when image upload request is not multipart", async () => {
    const app = createApp();
    const response = await app.request(
      "http://localhost/entities/entity-1/images",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "world" })
      },
      TEST_ENV
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_MULTIPART_BODY"
      }
    });
    expect(uploadEntityImageCommandMock).not.toHaveBeenCalled();
  });

  it("returns 400 when image file field is missing", async () => {
    const app = createApp();
    const formData = new FormData();
    formData.set("note", "no file");

    const response = await app.request(
      "http://localhost/entities/entity-1/images",
      {
        method: "POST",
        body: formData
      },
      TEST_ENV
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "IMAGE_FILE_REQUIRED"
      }
    });
    expect(uploadEntityImageCommandMock).not.toHaveBeenCalled();
  });
});
