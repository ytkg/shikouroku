import { describe, expect, it } from "vitest";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";
import {
  parseEntitiesResponse,
  parseEntityResponse,
  parseKindsResponse,
  parseOkResponse,
  parseTagResponse,
  parseTagsResponse
} from "@/entities/entity/api/entities.response";

describe("entities.response", () => {
  it("Entityレスポンスを正規化して返す", () => {
    const entity = parseEntityResponse({
      ok: true,
      entity: {
        id: "entity-1",
        kind: { id: 1, label: "book" },
        name: "Clean Code",
        description: null,
        is_wishlist: 1,
        tags: [{ id: 10, name: "read" }],
        created_at: "2026-02-19T00:00:00Z"
      }
    });

    expect(entity).toEqual({
      id: "entity-1",
      kind: { id: 1, label: "book" },
      name: "Clean Code",
      description: null,
      isWishlist: true,
      tags: [{ id: 10, name: "read" }],
      createdAt: "2026-02-19T00:00:00Z",
      updatedAt: undefined
    });
  });

  it("配列レスポンスでtags省略時は空配列になる", () => {
    const entities = parseEntitiesResponse({
      ok: true,
      entities: [
        {
          id: "entity-1",
          kind: { id: 1, label: "book" },
          name: "Clean Code",
          description: "notes",
          is_wishlist: 0
        }
      ]
    });

    expect(entities).toHaveLength(1);
    expect(entities[0]?.isWishlist).toBe(false);
    expect(entities[0]?.tags).toEqual([]);
  });

  it("kinds/tags/tag/okレスポンスを検証できる", () => {
    expect(
      parseKindsResponse({
        ok: true,
        kinds: [{ id: 1, label: "book" }]
      })
    ).toEqual([{ id: 1, label: "book" }]);

    expect(
      parseTagsResponse({
        ok: true,
        tags: [{ id: 2, name: "favorite" }]
      })
    ).toEqual([{ id: 2, name: "favorite" }]);

    expect(
      parseTagResponse({
        ok: true,
        tag: { id: 3, name: "later" }
      })
    ).toEqual({ id: 3, name: "later" });

    expect(() =>
      parseOkResponse({
        ok: true
      })
    ).not.toThrow();
  });

  it("不正レスポンスはApiError(INVALID_API_RESPONSE)をthrowする", () => {
    let thrown: unknown;

    try {
      parseEntityResponse({
        ok: true,
        entity: {
          id: "entity-1",
          kind: { id: 1, label: "book" },
          name: "Clean Code",
          description: null,
          is_wishlist: "yes"
        }
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
