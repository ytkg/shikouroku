import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";

type TagRecord = {
  id: number;
  name: string;
};

function createInMemoryTagDb(seed: TagRecord[]): D1Database {
  let tags = [...seed];
  let nextId = Math.max(0, ...seed.map((tag) => tag.id)) + 1;

  function createStatement(sql: string, args: unknown[]) {
    return {
      all: async () => {
        if (sql.includes("SELECT id, name FROM tags ORDER BY name ASC, id ASC")) {
          const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
          return { results: sorted };
        }

        throw new Error(`unsupported all query: ${sql}`);
      },
      first: async () => {
        if (sql.includes("SELECT id, name FROM tags WHERE name = ? LIMIT 1")) {
          const name = String(args[0] ?? "");
          const found = tags.find((tag) => tag.name === name);
          return found ?? null;
        }

        throw new Error(`unsupported first query: ${sql}`);
      },
      run: async () => {
        if (sql.includes("INSERT INTO tags (name) VALUES (?)")) {
          const name = String(args[0] ?? "");
          const inserted = { id: nextId, name };
          nextId += 1;
          tags.push(inserted);
          return {
            success: true,
            meta: {
              changes: 1,
              last_row_id: inserted.id
            }
          };
        }

        if (sql.includes("DELETE FROM entity_tags WHERE tag_id = ?")) {
          return {
            success: true,
            meta: {
              changes: 0
            }
          };
        }

        if (sql.includes("DELETE FROM tags WHERE id = ?")) {
          const id = Number(args[0] ?? 0);
          const before = tags.length;
          tags = tags.filter((tag) => tag.id !== id);
          return {
            success: true,
            meta: {
              changes: before - tags.length
            }
          };
        }

        throw new Error(`unsupported run query: ${sql}`);
      }
    };
  }

  const prepare = (sql: string) => ({
    ...createStatement(sql, []),
    bind: (...args: unknown[]) => createStatement(sql, args)
  });

  const batch = async (statements: D1PreparedStatement[]) => {
    const results: D1Result[] = [];
    for (const statement of statements as Array<{ run: () => Promise<D1Result> }>) {
      results.push(await statement.run());
    }
    return results;
  };

  return {
    prepare,
    batch
  } as unknown as D1Database;
}

function createTestEnv(seed: TagRecord[]) {
  return {
    AUTH_BASE_URL: "https://auth.example.test",
    ASSETS: {
      fetch: async () => new Response("not found", { status: 404 })
    },
    DB: createInMemoryTagDb(seed),
    ENTITY_IMAGES: {}
  } as const;
}

describe("tags integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports list, create, and delete cycle", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/verify")) {
        return new Response(null, { status: 200 });
      }

      return new Response(null, { status: 404 });
    });

    const env = createTestEnv([
      { id: 1, name: "coffee" },
      { id: 2, name: "tea" }
    ]);

    const listBefore = await app.request(
      "http://localhost/api/tags",
      {
        method: "GET",
        headers: {
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );
    expect(listBefore.status).toBe(200);
    await expect(listBefore.json()).resolves.toMatchObject({
      ok: true,
      tags: [
        { id: 1, name: "coffee" },
        { id: 2, name: "tea" }
      ]
    });

    const createResponse = await app.request(
      "http://localhost/api/tags",
      {
        method: "POST",
        headers: {
          Cookie: "shikouroku_token=token-123",
          "content-type": "application/json"
        },
        body: JSON.stringify({ name: "ramen" })
      },
      env as any
    );
    expect(createResponse.status).toBe(201);
    await expect(createResponse.json()).resolves.toMatchObject({
      ok: true,
      tag: { name: "ramen" }
    });

    const deleteResponse = await app.request(
      "http://localhost/api/tags/2",
      {
        method: "DELETE",
        headers: {
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );
    expect(deleteResponse.status).toBe(200);

    const listAfter = await app.request(
      "http://localhost/api/tags",
      {
        method: "GET",
        headers: {
          Cookie: "shikouroku_token=token-123"
        }
      },
      env as any
    );
    expect(listAfter.status).toBe(200);
    await expect(listAfter.json()).resolves.toMatchObject({
      ok: true,
      tags: [
        { id: 1, name: "coffee" },
        { name: "ramen" }
      ]
    });
  });
});
