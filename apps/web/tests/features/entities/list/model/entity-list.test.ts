import { describe, expect, it } from "vitest";
import type { Entity } from "@/entities/entity";
import {
  defaultEntityTab,
  getKindTabs,
  getVisibleEntities,
  parseEntityTab,
  toKindTab
} from "@/features/entities/list/model/entity-list";

function createEntity(input: {
  id: string;
  kindId: number;
  kindLabel: string;
  isWishlist?: boolean;
}): Entity {
  return {
    id: input.id,
    name: input.id,
    description: null,
    isWishlist: input.isWishlist ?? false,
    kind: {
      id: input.kindId,
      label: input.kindLabel
    },
    tags: []
  };
}

describe("entity-list model", () => {
  const entities: Entity[] = [
    createEntity({ id: "a", kindId: 2, kindLabel: "映画" }),
    createEntity({ id: "b", kindId: 1, kindLabel: "本" }),
    createEntity({ id: "c", kindId: 3, kindLabel: "ゲーム", isWishlist: true }),
    createEntity({ id: "d", kindId: 2, kindLabel: "映画" })
  ];

  it("toKindTab が kind タブ値を生成する", () => {
    expect(toKindTab(12)).toBe("kind-12");
  });

  it("parseEntityTab は有効値を受け入れ、不正値を既定値へフォールバックする", () => {
    expect(parseEntityTab("all")).toBe("all");
    expect(parseEntityTab("wishlist")).toBe("wishlist");
    expect(parseEntityTab("kind-5")).toBe("kind-5");
    expect(parseEntityTab("kind:5")).toBe(defaultEntityTab);
    expect(parseEntityTab("kind-0")).toBe(defaultEntityTab);
    expect(parseEntityTab("kind:-1")).toBe(defaultEntityTab);
    expect(parseEntityTab("kind-abc")).toBe(defaultEntityTab);
    expect(parseEntityTab("unknown")).toBe(defaultEntityTab);
    expect(parseEntityTab(null)).toBe(defaultEntityTab);
  });

  it("getKindTabs は wishlist を除外し kind id 昇順で返す", () => {
    expect(getKindTabs(entities)).toEqual([
      { id: 1, label: "本" },
      { id: 2, label: "映画" }
    ]);
  });

  it("all タブは wishlist 以外を返す", () => {
    const visible = getVisibleEntities(entities, "all");
    expect(visible.map((entity) => entity.id)).toEqual(["a", "b", "d"]);
  });

  it("wishlist タブは wishlist のみ返す", () => {
    const visible = getVisibleEntities(entities, "wishlist");
    expect(visible.map((entity) => entity.id)).toEqual(["c"]);
  });

  it("kind タブは対象 kind のみ返す", () => {
    const visible = getVisibleEntities(entities, "kind-2");
    expect(visible.map((entity) => entity.id)).toEqual(["a", "d"]);
  });
});
