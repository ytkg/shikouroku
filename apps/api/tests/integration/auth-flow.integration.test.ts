import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";

const TEST_ENV = {
  AUTH_BASE_URL: "https://auth.example.test",
  ASSETS: {
    fetch: async () => new Response("not found", { status: 404 })
  },
  DB: {},
  ENTITY_IMAGES: {}
} as any;

function extractCookieHeader(response: Response): string {
  const setCookies = response.headers.getSetCookie();
  return setCookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter((cookie): cookie is string => Boolean(cookie))
    .join("; ");
}

describe("auth flow integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports unauth redirect -> login -> authenticated /api/auth/me flow", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.endsWith("/login")) {
        return new Response(
          JSON.stringify({
            accessToken: "access-token-1",
            refreshToken: "refresh-token-1"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }

      if (url.endsWith("/verify")) {
        const authHeader = new Headers(init?.headers).get("Authorization");
        return authHeader === "Bearer access-token-1"
          ? new Response(null, { status: 200 })
          : new Response(null, { status: 401 });
      }

      if (url.endsWith("/refresh")) {
        return new Response(null, { status: 401 });
      }

      return new Response(null, { status: 404 });
    });

    const redirectResponse = await app.request("http://localhost/entities/new?draft=true", { method: "GET" }, TEST_ENV);
    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get("location")).toBe("/login?returnTo=%2Fentities%2Fnew%3Fdraft%3Dtrue");

    const loginResponse = await app.request(
      "http://localhost/api/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          username: "alice",
          password: "secret"
        })
      },
      TEST_ENV
    );

    expect(loginResponse.status).toBe(200);
    const cookieHeader = extractCookieHeader(loginResponse);
    expect(cookieHeader).toContain("shikouroku_token=access-token-1");
    expect(cookieHeader).toContain("shikouroku_refresh_token=refresh-token-1");

    const meResponse = await app.request(
      "http://localhost/api/auth/me",
      {
        method: "GET",
        headers: {
          Cookie: cookieHeader
        }
      },
      TEST_ENV
    );

    expect(meResponse.status).toBe(200);
    await expect(meResponse.json()).resolves.toMatchObject({
      ok: true,
      authenticated: true
    });
  });
});
