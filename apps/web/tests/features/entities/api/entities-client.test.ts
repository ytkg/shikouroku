import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEntities, fetchEntitiesPage, fetchEntityLocations, fetchKinds } from "@/entities/entity";
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

  it("fetchEntitiesは複数ページを連結して返す", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            page: {
              limit: 100,
              hasMore: true,
              nextCursor: "cursor-1",
              total: 2
            },
            entities: [
              {
                id: "entity-1",
                kind: { id: 1, label: "book" },
                name: "Clean Code",
                description: null,
                is_wishlist: 1,
                first_image_url: null,
                tags: []
              }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            page: {
              limit: 100,
              hasMore: false,
              nextCursor: null,
              total: 2
            },
            entities: [
              {
                id: "entity-2",
                kind: { id: 2, label: "movie" },
                name: "Blade Runner",
                description: null,
                is_wishlist: 0,
                first_image_url: null,
                tags: []
              }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      );

    const result = await fetchEntities();
    expect(result.map((entity) => entity.id)).toEqual(["entity-1", "entity-2"]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1]?.[0]).toBe("/api/entities?limit=100&cursor=cursor-1");
  });

  it("fetchEntitiesは循環cursorを検知したら停止する", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            page: {
              limit: 100,
              hasMore: true,
              nextCursor: "cursor-loop",
              total: 2
            },
            entities: [
              {
                id: "entity-1",
                kind: { id: 1, label: "book" },
                name: "Clean Code",
                description: null,
                is_wishlist: 1,
                first_image_url: null,
                tags: []
              }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            page: {
              limit: 100,
              hasMore: true,
              nextCursor: "cursor-loop",
              total: 2
            },
            entities: [
              {
                id: "entity-2",
                kind: { id: 2, label: "movie" },
                name: "Blade Runner",
                description: null,
                is_wishlist: 0,
                first_image_url: null,
                tags: []
              }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      );

    const result = await fetchEntities();
    expect(result.map((entity) => entity.id)).toEqual(["entity-1", "entity-2"]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
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

  it("fetchEntityLocationsは地図用のlocation一覧を取得する", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          locations: [
            {
              id: "entity-1",
              kind: { id: 1, label: "場所" },
              name: "東京駅",
              tags: [{ id: 10, name: "散歩" }],
              location: { latitude: 35.681236, longitude: 139.767125 }
            }
          ]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    await expect(fetchEntityLocations()).resolves.toEqual([
      {
        id: "entity-1",
        kind: { id: 1, label: "場所" },
        name: "東京駅",
        tags: [{ id: 10, name: "散歩" }],
        location: { latitude: 35.681236, longitude: 139.767125 }
      }
    ]);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/api/entities/locations");
  });
});
