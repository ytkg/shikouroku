import { describe, expect, it } from "vitest";
import { resolveEntityListQueryParams } from "../../../../../../src/modules/catalog/entity/application/entity-list-query-params";

describe("entity list query params", () => {
  it("未指定時は既定値に解決される", () => {
    const result = resolveEntityListQueryParams({});

    expect(result).toEqual({
      ok: true,
      data: {
        limit: 20,
        cursor: null,
        kindId: null,
        wishlist: "include",
        q: "",
        match: "partial",
        fields: ["title", "body", "tags"]
      }
    });
  });

  it("有効なクエリを解決できる", () => {
    const result = resolveEntityListQueryParams({
      limit: "10",
      cursor: "2026-01-01%2000%3A00%3A00:entity-1",
      match: "prefix",
      fields: "tags,title,title",
      kindId: "3",
      wishlist: "only",
      q: "ddd"
    });

    expect(result).toEqual({
      ok: true,
      data: {
        limit: 10,
        cursor: {
          createdAt: "2026-01-01 00:00:00",
          id: "entity-1"
        },
        kindId: 3,
        wishlist: "only",
        q: "ddd",
        match: "prefix",
        fields: ["tags", "title"]
      }
    });
  });

  it("limit が不正ならエラーを返す", () => {
    const result = resolveEntityListQueryParams({ limit: "0" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTITY_LIMIT",
        message: "limit must be an integer between 1 and 100"
      }
    });
  });

  it("cursor が不正ならエラーを返す", () => {
    const result = resolveEntityListQueryParams({ cursor: "invalid" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTITY_CURSOR",
        message: "cursor must be in a valid format"
      }
    });
  });

  it("match が不正ならエラーを返す", () => {
    const result = resolveEntityListQueryParams({ match: "contains" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTITY_MATCH",
        message: "match must be one of partial, prefix, exact"
      }
    });
  });

  it("fields が不正ならエラーを返す", () => {
    const result = resolveEntityListQueryParams({ fields: "unknown" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTITY_FIELDS",
        message: "fields must include at least one of title, body, tags"
      }
    });
  });

  it("kindId が不正ならエラーを返す", () => {
    const result = resolveEntityListQueryParams({ kindId: "-1" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTITY_KIND_ID",
        message: "kindId must be a positive integer"
      }
    });
  });

  it("wishlist が不正ならエラーを返す", () => {
    const result = resolveEntityListQueryParams({ wishlist: "invalid" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTITY_WISHLIST",
        message: "wishlist must be one of include, exclude, only"
      }
    });
  });
});
