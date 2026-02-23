import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { authSessionMiddleware } from "../../../src/middleware/auth-session-middleware";

vi.mock("../../../src/modules/auth/application/refresh-token-command", () => ({
  refreshTokenCommand: vi.fn()
}));

vi.mock("../../../src/modules/auth/application/verify-token-query", () => ({
  verifyTokenQuery: vi.fn()
}));

import { refreshTokenCommand } from "../../../src/modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../../../src/modules/auth/application/verify-token-query";

const refreshTokenCommandMock = vi.mocked(refreshTokenCommand);
const verifyTokenQueryMock = vi.mocked(verifyTokenQuery);

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
  app.use("*", authSessionMiddleware);
  app.post("/api/login", (c) => c.json({ ok: true }));
  app.get("/api/protected", (c) => c.json({ ok: true }));
  app.get("/api/immutable", () => Response.redirect("http://localhost/asset", 302));
  app.get("/login", (c) => c.text("login page"));
  app.get("/", (c) => c.text("home"));
  return app;
}

describe("authSessionMiddleware", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows /api/login without auth token", async () => {
    const app = createApp();
    verifyTokenQueryMock.mockResolvedValue(false);
    refreshTokenCommandMock.mockResolvedValue({ ok: false, status: 401, message: "Invalid refresh token" });

    const response = await app.request("http://localhost/api/login", { method: "POST" }, TEST_ENV);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns 401 for protected api without valid token", async () => {
    const app = createApp();
    verifyTokenQueryMock.mockResolvedValue(false);
    refreshTokenCommandMock.mockResolvedValue({ ok: false, status: 401, message: "Invalid refresh token" });

    const response = await app.request("http://localhost/api/protected", { method: "GET" }, TEST_ENV);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "unauthorized"
      }
    });
    expect(response.headers.get("set-cookie")).toContain("shikouroku_token=");
  });

  it("redirects authenticated user from /login to /", async () => {
    const app = createApp();
    verifyTokenQueryMock.mockResolvedValue(true);

    const response = await app.request(
      "http://localhost/login",
      {
        method: "GET",
        headers: {
          Cookie: "shikouroku_token=token"
        }
      },
      TEST_ENV
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/");
  });

  it("redirects unauthenticated dotted route path to /login", async () => {
    const app = createApp();

    const response = await app.request("http://localhost/profile.v2/edit", { method: "GET" }, TEST_ENV);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
    expect(response.headers.get("set-cookie")).toContain("shikouroku_token=");
  });

  it("treats file-like request path as static asset", async () => {
    const app = createApp();

    const response = await app.request("http://localhost/favicon.ico", { method: "GET" }, TEST_ENV);

    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
  });

  it("appends cookies after token refresh even when downstream response headers are immutable", async () => {
    const app = createApp();
    verifyTokenQueryMock.mockResolvedValue(false);
    refreshTokenCommandMock.mockResolvedValue({
      ok: true,
      data: { accessToken: "new-access", refreshToken: "new-refresh" }
    });

    const response = await app.request(
      "http://localhost/api/immutable",
      {
        method: "GET",
        headers: {
          Cookie: "shikouroku_refresh_token=refresh-token"
        }
      },
      TEST_ENV
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/asset");
    expect(response.headers.get("set-cookie")).toContain("shikouroku_token=new-access");
    expect(response.headers.get("set-cookie")).toContain("shikouroku_refresh_token=new-refresh");
  });
});
