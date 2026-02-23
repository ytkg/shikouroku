import { describe, expect, it } from "vitest";
import {
  defaultEntityWishlistFilter,
  normalizeEntitySearchFieldsSelection,
  parseEntityListSearchCriteria,
  parseEntityKindTab,
  defaultEntitySearchFields,
  defaultEntitySearchMatch,
  parseEntityKindFilter,
  parseEntityWishlistFilter,
  parseEntitySearchFields,
  parseEntitySearchMatch,
  setEntityKindTabParams,
  setEntitySearchFieldsParam,
  setEntitySearchMatchParam,
  setEntitySearchQueryParam,
  toggleEntitySearchFieldSelection,
  toEntityListCriteriaKey,
  toKindTab,
  toEntitySearchFieldsParam
} from "@/features/entities/list/model/entity-list";

describe("entity-list model", () => {
  it("parseEntitySearchMatch は有効値を受け取り、不正値を既定値へフォールバックする", () => {
    expect(parseEntitySearchMatch("partial")).toBe("partial");
    expect(parseEntitySearchMatch("prefix")).toBe("prefix");
    expect(parseEntitySearchMatch("exact")).toBe("exact");
    expect(parseEntitySearchMatch("contains")).toBe(defaultEntitySearchMatch);
    expect(parseEntitySearchMatch(null)).toBe(defaultEntitySearchMatch);
  });

  it("parseEntitySearchFields は有効値のみを順序付きで返し、不正値では既定値へフォールバックする", () => {
    expect(parseEntitySearchFields("tags,title,title")).toEqual(["title", "tags"]);
    expect(parseEntitySearchFields("body")).toEqual(["body"]);
    expect(parseEntitySearchFields("unknown")).toEqual(defaultEntitySearchFields);
    expect(parseEntitySearchFields("")).toEqual(defaultEntitySearchFields);
    expect(parseEntitySearchFields(null)).toEqual(defaultEntitySearchFields);
  });

  it("toEntitySearchFieldsParam は既定セットを null にし、部分セットをCSV化する", () => {
    expect(toEntitySearchFieldsParam(["title", "body", "tags"])).toBeNull();
    expect(toEntitySearchFieldsParam([])).toBeNull();
    expect(toEntitySearchFieldsParam(["tags", "title"])).toBe("title,tags");
    expect(toEntitySearchFieldsParam(["body"])).toBe("body");
  });

  it("normalizeEntitySearchFieldsSelection は定義順で重複なく返す", () => {
    expect(normalizeEntitySearchFieldsSelection(["tags", "title", "tags"])).toEqual(["title", "tags"]);
    expect(normalizeEntitySearchFieldsSelection(["body"])).toEqual(["body"]);
    expect(normalizeEntitySearchFieldsSelection([])).toEqual([]);
  });

  it("toggleEntitySearchFieldSelection は0件状態を作らずに切り替える", () => {
    expect(toggleEntitySearchFieldSelection(["title", "body", "tags"], "title", true)).toEqual([
      "title"
    ]);
    expect(toggleEntitySearchFieldSelection(["title", "body"], "title", false)).toEqual(["body"]);
    expect(toggleEntitySearchFieldSelection(["title"], "title", false)).toEqual([
      "title",
      "body",
      "tags"
    ]);
    expect(toggleEntitySearchFieldSelection(["title"], "tags", false)).toEqual(["title", "tags"]);
  });

  it("parseEntityKindFilter は正の整数を受け取り、それ以外は null を返す", () => {
    expect(parseEntityKindFilter("1")).toBe(1);
    expect(parseEntityKindFilter("25")).toBe(25);
    expect(parseEntityKindFilter("0")).toBeNull();
    expect(parseEntityKindFilter("-1")).toBeNull();
    expect(parseEntityKindFilter("abc")).toBeNull();
    expect(parseEntityKindFilter(null)).toBeNull();
  });

  it("parseEntityWishlistFilter は only 以外を exclude に正規化する", () => {
    expect(parseEntityWishlistFilter("only")).toBe("only");
    expect(parseEntityWishlistFilter("exclude")).toBe(defaultEntityWishlistFilter);
    expect(parseEntityWishlistFilter("include")).toBe(defaultEntityWishlistFilter);
    expect(parseEntityWishlistFilter("invalid")).toBe(defaultEntityWishlistFilter);
    expect(parseEntityWishlistFilter(null)).toBe(defaultEntityWishlistFilter);
  });

  it("parseEntityKindTab は kindId と wishlist からタブ値を決める", () => {
    expect(toKindTab(3)).toBe("kind-3");
    expect(parseEntityKindTab(2, "exclude")).toBe("kind-2");
    expect(parseEntityKindTab(2, "only")).toBe("wishlist");
    expect(parseEntityKindTab(null, "exclude")).toBe("all");
  });

  it("parseEntityListSearchCriteria は検索クエリを正規化する", () => {
    const criteria = parseEntityListSearchCriteria(
      new URLSearchParams("q=code&kindId=2&match=prefix&fields=tags,title")
    );

    expect(criteria).toEqual({
      rawQuery: "code",
      kindId: 2,
      wishlistFilter: "exclude",
      selectedKindTab: "kind-2",
      match: "prefix",
      selectedFields: ["title", "tags"],
      isAllFieldsSelected: false
    });
  });

  it("toEntityListCriteriaKey は検索条件から安定したキーを作る", () => {
    const criteria = parseEntityListSearchCriteria(
      new URLSearchParams("q=code&wishlist=only&match=exact&fields=body")
    );

    expect(toEntityListCriteriaKey(criteria)).toBe("code\nall\nonly\nexact\nbody");
  });

  it("setEntitySearchQueryParam は空文字で削除し、値をtrimして設定する", () => {
    const searchParams = new URLSearchParams("q=before&x=1");
    setEntitySearchQueryParam(searchParams, "  after  ");
    expect(searchParams.toString()).toBe("q=after&x=1");

    setEntitySearchQueryParam(searchParams, "   ");
    expect(searchParams.toString()).toBe("x=1");
  });

  it("setEntitySearchMatchParam は既定値で削除し、非既定値を設定する", () => {
    const searchParams = new URLSearchParams("match=prefix");
    setEntitySearchMatchParam(searchParams, "partial");
    expect(searchParams.toString()).toBe("");

    setEntitySearchMatchParam(searchParams, "exact");
    expect(searchParams.toString()).toBe("match=exact");
  });

  it("setEntityKindTabParams は種別タブに応じて kindId/wishlist を更新する", () => {
    const allParams = new URLSearchParams("kindId=3&wishlist=only");
    setEntityKindTabParams(allParams, "all");
    expect(allParams.toString()).toBe("");

    const wishlistParams = new URLSearchParams("kindId=3");
    setEntityKindTabParams(wishlistParams, "wishlist");
    expect(wishlistParams.toString()).toBe("wishlist=only");

    const kindParams = new URLSearchParams("wishlist=only");
    setEntityKindTabParams(kindParams, "kind-5");
    expect(kindParams.toString()).toBe("kindId=5");
  });

  it("setEntitySearchFieldsParam は空選択を拒否し、既定セット時はfieldsを削除する", () => {
    const emptyParams = new URLSearchParams("fields=title");
    expect(setEntitySearchFieldsParam(emptyParams, [])).toBe(false);
    expect(emptyParams.toString()).toBe("fields=title");

    const allParams = new URLSearchParams("fields=title");
    expect(setEntitySearchFieldsParam(allParams, ["title", "body", "tags"])).toBe(true);
    expect(allParams.toString()).toBe("");

    const partialParams = new URLSearchParams();
    expect(setEntitySearchFieldsParam(partialParams, ["tags", "title"])).toBe(true);
    expect(partialParams.toString()).toBe("fields=title%2Ctags");
  });
});
