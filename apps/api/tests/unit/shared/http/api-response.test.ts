import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../../../../src/app-env";
import { jsonError, jsonOk } from "../../../../src/shared/http/api-response";
import { REQUEST_ID_HEADER, requestIdMiddleware } from "../../../../src/shared/http/request-id";

function createTestApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("*", requestIdMiddleware);

  app.get("/ok", (c) => {
    return jsonOk(c, { value: "ok" });
  });

  app.get("/error", (c) => {
    return jsonError(c, 400, "BAD_INPUT", "bad input");
  });

  app.get("/immutable", () => {
    return Response.redirect("http://localhost/redirected", 302);
  });

  return app;
}

describe("api-response", () => {
  it("returns unified success body with requestId", async () => {
    const app = createTestApp();
    const response = await app.request("http://localhost/ok", {
      headers: {
        [REQUEST_ID_HEADER]: "req-001"
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe("req-001");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      value: "ok",
      requestId: "req-001"
    });
  });

  it("returns unified error body with requestId", async () => {
    const app = createTestApp();
    const response = await app.request("http://localhost/error", {
      headers: {
        [REQUEST_ID_HEADER]: "req-err-01"
      }
    });

    expect(response.status).toBe(400);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe("req-err-01");
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "BAD_INPUT",
        message: "bad input"
      },
      requestId: "req-err-01"
    });
  });

  it("generates requestId when header is not provided", async () => {
    const app = createTestApp();
    const response = await app.request("http://localhost/ok");
    const body = (await response.json()) as { requestId: string };

    expect(response.status).toBe(200);
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(body.requestId);
  });

  it("adds request id header even when downstream response headers are immutable", async () => {
    const app = createTestApp();
    const response = await app.request("http://localhost/immutable", {
      headers: {
        [REQUEST_ID_HEADER]: "req-immutable"
      }
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/redirected");
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe("req-immutable");
  });
});
