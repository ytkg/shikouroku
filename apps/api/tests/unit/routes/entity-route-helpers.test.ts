import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import {
  buildEntityImageFileResponse,
  parseMultipartFileFromRequest,
  resolveEntityListQueryFromRequest
} from "../../../src/routes/api/entity-route-helpers";
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

describe("entity route helpers", () => {
  it("resolves list query from request and returns validation error when invalid", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", requestIdMiddleware);
    app.get("/entities", (c) => {
      const resolved = resolveEntityListQueryFromRequest(c);
      if (!resolved.ok) {
        return resolved.response;
      }

      return jsonOk(c, { query: resolved.data });
    });

    const invalidResponse = await app.request("http://localhost/entities?limit=0", { method: "GET" }, TEST_ENV);
    expect(invalidResponse.status).toBe(400);
    await expect(invalidResponse.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_ENTITY_LIMIT" }
    });

    const validResponse = await app.request("http://localhost/entities?limit=10&q=abc", { method: "GET" }, TEST_ENV);
    expect(validResponse.status).toBe(200);
    await expect(validResponse.json()).resolves.toMatchObject({
      ok: true,
      query: {
        limit: 10,
        q: "abc"
      }
    });
  });

  it("parses multipart file field and returns error when file is missing", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", requestIdMiddleware);
    app.post("/upload", async (c) => {
      const parsed = await parseMultipartFileFromRequest(c, "file");
      if (!parsed.ok) {
        return parsed.response;
      }

      return jsonOk(c, { fileName: parsed.file.name });
    });

    const missingForm = new FormData();
    missingForm.set("note", "no file");
    const missingResponse = await app.request(
      "http://localhost/upload",
      { method: "POST", body: missingForm },
      TEST_ENV
    );
    expect(missingResponse.status).toBe(400);
    await expect(missingResponse.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "IMAGE_FILE_REQUIRED" }
    });

    const validForm = new FormData();
    validForm.set("file", new File(["hello"], "sample.png", { type: "image/png" }));
    const validResponse = await app.request("http://localhost/upload", { method: "POST", body: validForm }, TEST_ENV);
    expect(validResponse.status).toBe(200);
    await expect(validResponse.json()).resolves.toMatchObject({
      ok: true,
      fileName: "sample.png"
    });
  });

  it("builds image file response with expected headers", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("abc"));
        controller.close();
      }
    });
    const response = buildEntityImageFileResponse(stream, "image/png", 3);

    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Content-Length")).toBe("3");
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=300");
    await expect(response.text()).resolves.toBe("abc");
  });
});
