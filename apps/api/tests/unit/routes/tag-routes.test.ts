import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { createTagRoutes } from "../../../src/routes/api/tag-routes";
import { requestIdMiddleware } from "../../../src/shared/http/request-id";

vi.mock("../../../src/modules/catalog/tag/application/list-tags-query", () => ({
  listTagsQuery: vi.fn()
}));

vi.mock("../../../src/modules/catalog/tag/application/create-tag-command", () => ({
  createTagCommand: vi.fn()
}));

vi.mock("../../../src/modules/catalog/tag/application/delete-tag-command", () => ({
  deleteTagCommand: vi.fn()
}));

vi.mock("../../../src/modules/catalog/tag/infra/tag-repository-d1", () => ({
  createD1TagRepository: vi.fn(() => ({ mocked: true }))
}));

import { createTagCommand } from "../../../src/modules/catalog/tag/application/create-tag-command";
import { deleteTagCommand } from "../../../src/modules/catalog/tag/application/delete-tag-command";
import { listTagsQuery } from "../../../src/modules/catalog/tag/application/list-tags-query";

const createTagCommandMock = vi.mocked(createTagCommand);
const deleteTagCommandMock = vi.mocked(deleteTagCommand);
const listTagsQueryMock = vi.mocked(listTagsQuery);

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
  app.route("/", createTagRoutes());
  return app;
}

describe("tag routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns tags list", async () => {
    const app = createApp();
    listTagsQueryMock.mockResolvedValue({
      ok: true,
      data: {
        tags: [{ id: 1, name: "coffee" }]
      }
    });

    const response = await app.request("http://localhost/tags", { method: "GET" }, TEST_ENV);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      tags: [{ id: 1, name: "coffee" }]
    });
  });

  it("returns 400 when deleting with invalid tag id", async () => {
    const app = createApp();
    const response = await app.request("http://localhost/tags/0", { method: "DELETE" }, TEST_ENV);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_TAG_ID",
        message: "tag id is invalid"
      }
    });
    expect(deleteTagCommandMock).not.toHaveBeenCalled();
  });

  it("creates tag on valid request body", async () => {
    const app = createApp();
    createTagCommandMock.mockResolvedValue({
      ok: true,
      data: {
        tag: { id: 2, name: "tea" }
      }
    });

    const response = await app.request(
      "http://localhost/tags",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "tea" })
      },
      TEST_ENV
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      tag: { id: 2, name: "tea" }
    });
    expect(createTagCommandMock).toHaveBeenCalledWith(expect.any(Object), "tea");
  });
});
