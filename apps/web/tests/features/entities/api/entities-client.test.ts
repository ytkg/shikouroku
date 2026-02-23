import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEntities, fetchEntitiesPage, fetchKinds } from "@/entities/entity";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("entities.client", () => {
  it("fetchEntitiesはAPIレスポンスをEntity形式へ正規化する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          page: {
            limit: 100,
            hasMore: false,
            nextCursor: null,
            total: 1
          },
          entities: [
            {
              id: "entity-1",
              kind: { id: 1, label: "book" },
              name: "Clean Code",
              description: null,
              is_wishlist: 1,
              first_image_url: "/api/entities/entity-1/images/image-1/file",
              tags: [{ id: 10, name: "read" }]
            }
          ]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    await expect(fetchEntities()).resolves.toEqual([
      {
        id: "entity-1",
        kind: { id: 1, label: "book" },
        name: "Clean Code",
        description: null,
        isWishlist: true,
        firstImageUrl: "/api/entities/entity-1/images/image-1/file",
        tags: [{ id: 10, name: "read" }],
        createdAt: undefined,
        updatedAt: undefined
      }
    ]);
  });

  it("fetchEntitiesPageは検索条件をクエリに変換する", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          page: {
            limit: 10,
            hasMore: false,
            nextCursor: null,
            total: 0
          },
          entities: []
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    await fetchEntitiesPage({
      q: "code",
      fields: ["title", "tags"],
      match: "prefix",
      kindId: 2,
      wishlist: "exclude",
      limit: 10,
      cursor: "cursor-token"
    });

    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      "/api/entities?limit=10&q=code&match=prefix&fields=title%2Ctags&kindId=2&wishlist=exclude&cursor=cursor-token"
    );
  });

  it("fetchEntitiesPageはタグのみ検索を fields=tags で送信する", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          page: {
            limit: 20,
            hasMore: false,
            nextCursor: null,
            total: 0
          },
          entities: []
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    await fetchEntitiesPage({
      q: "design",
      fields: ["tags"]
    });

    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/api/entities?limit=20&q=design&fields=tags");
  });

  it("fetchKindsは不正なレスポンス形をApiError(INVALID_API_RESPONSE)として扱う", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, kinds: [{ id: "1", label: "book" }] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(fetchKinds()).rejects.toMatchObject<ApiError>({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
