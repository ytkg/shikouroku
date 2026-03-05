import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { createAuthRoutes } from "../../../src/routes/api/auth-routes";
import { requestIdMiddleware } from "../../../src/shared/http/request-id";

vi.mock("../../../src/modules/auth/application/login-command", () => ({
  loginCommand: vi.fn()
}));

vi.mock("../../../src/modules/auth/infra/auth-gateway-http", () => ({
  createHttpAuthGateway: vi.fn(() => ({ mocked: true }))
}));

import { loginCommand } from "../../../src/modules/auth/application/login-command";

const loginCommandMock = vi.mocked(loginCommand);

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
  app.route("/", createAuthRoutes());
  return app;
}

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authenticated=true at /auth/me", async () => {
    const app = createApp();
    const response = await app.request("http://localhost/auth/me", { method: "GET" }, TEST_ENV);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      authenticated: true
    });
  });

  it("returns 400 when login body is invalid", async () => {
    const app = createApp();
    const response = await app.request(
      "http://localhost/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "" })
      },
      TEST_ENV
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_REQUEST_BODY"
      }
    });
    expect(loginCommandMock).not.toHaveBeenCalled();
  });

  it("sets auth cookies when login succeeds", async () => {
    const app = createApp();
    loginCommandMock.mockResolvedValue({
      ok: true,
      data: {
        accessToken: "access-token",
        refreshToken: "refresh-token"
      }
    });

    const response = await app.request(
      "http://localhost/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "alice", password: "secret" })
      },
      TEST_ENV
    );

    expect(response.status).toBe(200);
    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toHaveLength(2);
    expect(setCookies[0]).toContain("shikouroku_token=access-token");
    expect(setCookies[1]).toContain("shikouroku_refresh_token=refresh-token");
  });
});
