import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../../src/index";
import { REQUEST_ID_HEADER } from "../../../src/shared/http/request-id";

type TagRecord = {
  id: number;
  name: string;
};

function createInMemoryTagDb(seed: TagRecord[]): D1Database {
  const tags = [...seed];

  function createStatement(sql: string) {
    return {
      all: async () => {
        if (sql.includes("SELECT id, name FROM tags ORDER BY name ASC, id ASC")) {
          const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
          return { results: sorted };
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

const TEST_ENV_BASE = {
  AUTH_BASE_URL: "https://auth.example.test",
  ASSETS: {
    fetch: async () => new Response("not found", { status: 404 })
  },
  ENTITY_IMAGES: {}
} as const;

describe("api success response contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns standard success envelope for /api/tags", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const env = {
      ...TEST_ENV_BASE,
      DB: createInMemoryTagDb([
        { id: 2, name: "tea" },
        { id: 1, name: "coffee" }
      ])
    };

    const response = await app.request(
      "http://localhost/api/tags",
      {
        method: "GET",
        headers: {
          [REQUEST_ID_HEADER]: "req-tags-success",
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      tags: [
        { id: 1, name: "coffee" },
        { id: 2, name: "tea" }
      ],
      requestId: "req-tags-success"
    });
  });

  it("returns standard success envelope for /api/auth/me with valid token", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/verify")) {
        return new Response(null, { status: 200 });
      }

      return new Response(null, { status: 404 });
    });

    const env = {
      ...TEST_ENV_BASE,
      DB: createInMemoryTagDb([])
    };

    const response = await app.request(
      "http://localhost/api/auth/me",
      {
        method: "GET",
        headers: {
          [REQUEST_ID_HEADER]: "req-auth-me-success",
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      authenticated: true,
      requestId: "req-auth-me-success"
    });
  });
});
