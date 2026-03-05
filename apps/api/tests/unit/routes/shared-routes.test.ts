import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { parsePositiveIntegerParam } from "../../../src/routes/api/shared";
import { jsonOk } from "../../../src/shared/http/api-response";
import { requestIdMiddleware } from "../../../src/shared/http/request-id";

const TEST_ENV = {
  AUTH_BASE_URL: "https://auth.example.test",
  ASSETS: {
    fetch: async () => new Response("not found", { status: 404 })
  },
  DB: {},
  ENTITY_IMAGES: {}
} as any;

describe("api route shared helpers", () => {
  it("returns 400 when positive integer param is invalid", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", requestIdMiddleware);
    app.get("/tags/:id", (c) => {
      const parsedId = parsePositiveIntegerParam(c, c.req.param("id"), "INVALID_TAG_ID", "tag id");
      if (!parsedId.ok) {
        return parsedId.response;
      }

      return jsonOk(c, { id: parsedId.value });
    });

    const response = await app.request("http://localhost/tags/0", { method: "GET" }, TEST_ENV);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_TAG_ID",
        message: "tag id is invalid"
      }
    });
  });

  it("returns parsed integer when param is valid", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", requestIdMiddleware);
    app.get("/tags/:id", (c) => {
      const parsedId = parsePositiveIntegerParam(c, c.req.param("id"), "INVALID_TAG_ID", "tag id");
      if (!parsedId.ok) {
        return parsedId.response;
      }

      return jsonOk(c, { id: parsedId.value });
    });

    const response = await app.request("http://localhost/tags/12", { method: "GET" }, TEST_ENV);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      id: 12
    });
  });
});
