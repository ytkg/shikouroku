import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../../src/index";
import { REQUEST_ID_HEADER } from "../../../src/shared/http/request-id";

const TEST_ENV = {
  AUTH_BASE_URL: "https://auth.example.test",
  ASSETS: {
    fetch: async () => new Response("not found", { status: 404 })
  },
  DB: {},
  ENTITY_IMAGES: {}
} as any;

describe("api error response contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns UNAUTHORIZED error payload for protected api", async () => {
    const response = await app.request(
      "http://localhost/api/tags",
      {
        method: "POST",
        headers: {
          [REQUEST_ID_HEADER]: "req-unauthorized"
        }
      },
      TEST_ENV
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "unauthorized"
      },
      requestId: "req-unauthorized"
    });
  });

  it("returns NOT_FOUND error payload for unknown api route after auth", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    const response = await app.request(
      "http://localhost/api/unknown",
      {
        headers: {
          [REQUEST_ID_HEADER]: "req-not-found",
          Cookie: "shikouroku_token=token-123"
        }
      },
      TEST_ENV
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "not found"
      },
      requestId: "req-not-found"
    });
  });

  it("returns INVALID_REQUEST_BODY payload for /api/login with invalid body", async () => {
    const response = await app.request(
      "http://localhost/api/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [REQUEST_ID_HEADER]: "req-login-invalid"
        },
        body: JSON.stringify({ username: "" })
      },
      TEST_ENV
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_REQUEST_BODY"
      },
      requestId: "req-login-invalid"
    });
  });

  it("returns INVALID_TAG_ID payload for /api/tags/:id with invalid id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    const response = await app.request(
      "http://localhost/api/tags/0",
      {
        method: "DELETE",
        headers: {
          [REQUEST_ID_HEADER]: "req-tag-invalid-id",
          Cookie: "shikouroku_token=token-123"
        }
      },
      TEST_ENV
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "INVALID_TAG_ID",
        message: "tag id is invalid"
      },
      requestId: "req-tag-invalid-id"
    });
  });
});
