import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEntities, fetchKinds } from "@/entities/entity";
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
          entities: [
            {
              id: "entity-1",
              kind: { id: 1, label: "book" },
              name: "Clean Code",
              description: null,
              is_wishlist: 1,
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
        tags: [{ id: 10, name: "read" }],
        createdAt: undefined,
        updatedAt: undefined
      }
    ]);
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
