import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createEntityRelation,
  deleteEntityRelation,
  fetchRelatedEntities
} from "@/entities/entity/api/related.client";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("related.client", () => {
  it("fetchRelatedEntitiesは関連嗜好レスポンスを正規化する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          related: [
            {
              id: "entity-2",
              kind: { id: 2, label: "shop" },
              name: "たなか青空笑店",
              description: null,
              is_wishlist: 0,
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

    await expect(fetchRelatedEntities("entity-1")).resolves.toEqual([
      {
        id: "entity-2",
        kind: { id: 2, label: "shop" },
        name: "たなか青空笑店",
        description: null,
        isWishlist: false,
        tags: [],
        createdAt: undefined,
        updatedAt: undefined
      }
    ]);
  });

  it("create/delete は関連APIパスを使って更新する", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await createEntityRelation("entity-1", { relatedEntityId: "entity-2" });
    await deleteEntityRelation("entity-1", "entity-2");

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/entities/entity-1/related",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ relatedEntityId: "entity-2" })
      })
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/entities/entity-1/related/entity-2",
      expect.objectContaining({
        method: "DELETE"
      })
    );
  });

  it("createEntityRelationは不正レスポンス形をApiError(INVALID_API_RESPONSE)として扱う", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: "yes" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(
      createEntityRelation("entity-1", { relatedEntityId: "entity-2" })
    ).rejects.toMatchObject<ApiError>({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
