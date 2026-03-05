import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../../src/index";
import {
  COMMON_SECURITY_HEADERS,
  CONTENT_SECURITY_POLICY_HEADER,
  HTML_CONTENT_SECURITY_POLICY,
  STRICT_TRANSPORT_SECURITY_HEADER,
  STRICT_TRANSPORT_SECURITY_VALUE
} from "../../../src/middleware/security-headers-middleware";
import { REQUEST_ID_HEADER } from "../../../src/shared/http/request-id";

function createKindDb(): D1Database {
  function createStatement(sql: string) {
    return {
      all: async () => {
        if (sql.includes("SELECT id, label FROM kinds ORDER BY id ASC")) {
          return {
            results: [
              { id: 1, label: "場所" },
              { id: 2, label: "本" }
            ]
          };
        }

        throw new Error(`unsupported all query: ${sql}`);
      }
    };
  }

  const prepare = (sql: string) => ({
    ...createStatement(sql),
    bind: () => createStatement(sql)
  });

  return { prepare } as unknown as D1Database;
}

function createTestEnv() {
  return {
    AUTH_BASE_URL: "https://auth.example.test",
    ASSETS: {
      fetch: async (request: Request) => {
        const pathname = new URL(request.url).pathname;
        if (pathname === "/" || pathname === "/index.html") {
          return new Response("<!doctype html><html><body>app</body></html>", {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8"
            }
          });
        }

        return new Response("not found", { status: 404 });
      }
    },
    DB: createKindDb(),
    ENTITY_IMAGES: {}
  } as any;
}

function expectCommonSecurityHeaders(response: Response): void {
  for (const [headerName, headerValue] of Object.entries(COMMON_SECURITY_HEADERS)) {
    expect(response.headers.get(headerName)).toBe(headerValue);
  }
}

describe("security headers contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds common security headers on 200 API response", async () => {
    const response = await app.request(
      "http://localhost/api/kinds",
      {
        method: "GET",
        headers: {
          [REQUEST_ID_HEADER]: "req-sec-kinds"
        }
      },
      createTestEnv()
    );

    expect(response.status).toBe(200);
    expectCommonSecurityHeaders(response);
    expect(response.headers.get(STRICT_TRANSPORT_SECURITY_HEADER)).toBeNull();
    expect(response.headers.get(CONTENT_SECURITY_POLICY_HEADER)).toBeNull();
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe("req-sec-kinds");
  });

  it("adds common security headers on 401 unauthorized response", async () => {
    const response = await app.request(
      "http://localhost/api/tags",
      {
        method: "POST",
        headers: {
          [REQUEST_ID_HEADER]: "req-sec-401"
        }
      },
      createTestEnv()
    );

    expect(response.status).toBe(401);
    expectCommonSecurityHeaders(response);
    expect(response.headers.get(CONTENT_SECURITY_POLICY_HEADER)).toBeNull();
  });

  it("adds common security headers on 404 API response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/verify")) {
        return new Response(null, { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const response = await app.request(
      "http://localhost/api/unknown",
      {
        method: "GET",
        headers: {
          [REQUEST_ID_HEADER]: "req-sec-404",
          Cookie: "shikouroku_token=token-123"
        }
      },
      createTestEnv()
    );

    expect(response.status).toBe(404);
    expectCommonSecurityHeaders(response);
    expect(response.headers.get(CONTENT_SECURITY_POLICY_HEADER)).toBeNull();
  });

  it("adds CSP only on HTML response", async () => {
    const response = await app.request(
      "http://localhost/",
      {
        method: "GET",
        headers: {
          [REQUEST_ID_HEADER]: "req-sec-html"
        }
      },
      createTestEnv()
    );

    expect(response.status).toBe(200);
    expectCommonSecurityHeaders(response);
    expect(response.headers.get(CONTENT_SECURITY_POLICY_HEADER)).toBe(HTML_CONTENT_SECURITY_POLICY);
  });

  it("keeps Set-Cookie alongside common security headers on refresh flow", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/refresh")) {
        return new Response(
          JSON.stringify({
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token"
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
        return new Response(null, { status: 401 });
      }

      return new Response(null, { status: 404 });
    });

    const response = await app.request(
      "http://localhost/api/kinds",
      {
        method: "GET",
        headers: {
          Cookie: "shikouroku_refresh_token=refresh-token-123"
        }
      },
      createTestEnv()
    );

    expect(response.status).toBe(200);
    expectCommonSecurityHeaders(response);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("shikouroku_token=new-access-token");
    expect(setCookie).toContain("shikouroku_refresh_token=new-refresh-token");
  });

  it("adds HSTS only for https requests", async () => {
    const response = await app.request(
      "https://localhost/api/kinds",
      {
        method: "GET",
        headers: {
          [REQUEST_ID_HEADER]: "req-sec-hsts"
        }
      },
      createTestEnv()
    );

    expect(response.status).toBe(200);
    expect(response.headers.get(STRICT_TRANSPORT_SECURITY_HEADER)).toBe(STRICT_TRANSPORT_SECURITY_VALUE);
  });
});
