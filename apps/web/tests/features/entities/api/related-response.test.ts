import { describe, expect, it } from "vitest";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";
import {
  parseRelatedEntitiesResponse,
  parseRelatedMutationResponse
} from "@/entities/entity/api/related.response";

describe("related.response", () => {
  it("関連嗜好レスポンスを正規化して返す", () => {
    const related = parseRelatedEntitiesResponse({
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
    });

    expect(related).toEqual([
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

  it("関連更新レスポンスを検証できる", () => {
    expect(() =>
      parseRelatedMutationResponse({
        ok: true
      })
    ).not.toThrow();
  });

  it("不正レスポンスはApiError(INVALID_API_RESPONSE)をthrowする", () => {
    let thrown: unknown;

    try {
      parseRelatedEntitiesResponse({
        ok: true,
        related: [
          {
            id: "entity-2",
            kind: { id: 2, label: "shop" },
            name: "たなか青空笑店",
            description: null,
            is_wishlist: "invalid"
          }
        ]
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
