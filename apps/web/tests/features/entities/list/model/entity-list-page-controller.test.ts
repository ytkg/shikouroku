import { describe, expect, it } from "vitest";
import {
  buildEntityListFetchInput,
  ENTITY_PAGE_LIMIT
} from "@/features/entities/list/model/entity-list-page-controller";

describe("entity-list page controller", () => {
  it("検索条件から一覧取得入力を組み立てる", () => {
    const input = buildEntityListFetchInput({
      rawQuery: "ddd",
      kindId: 2,
      wishlistFilter: "only",
      selectedKindTab: "wishlist",
      match: "prefix",
      selectedFields: ["title", "tags"],
      isAllFieldsSelected: false
    });

    expect(input).toEqual({
      q: "ddd",
      kindId: 2,
      wishlist: "only",
      match: "prefix",
      fields: ["title", "tags"],
      limit: ENTITY_PAGE_LIMIT,
      cursor: undefined,
      signal: undefined
    });
  });

  it("cursor と signal をそのまま引き継ぐ", () => {
    const controller = new AbortController();
    const input = buildEntityListFetchInput(
      {
        rawQuery: "",
        kindId: null,
        wishlistFilter: "exclude",
        selectedKindTab: "all",
        match: "partial",
        selectedFields: ["title", "body", "tags"],
        isAllFieldsSelected: true
      },
      {
        cursor: "cursor-token",
        signal: controller.signal
      }
    );

    expect(input.cursor).toBe("cursor-token");
    expect(input.signal).toBe(controller.signal);
  });
});
