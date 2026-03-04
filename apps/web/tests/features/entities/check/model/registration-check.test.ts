import { describe, expect, it } from "vitest";
import type { Entity, EntityLocationPin } from "@/entities/entity";
import { buildRegistrationCheckResult } from "@/features/entities/check/model/registration-check";

function makeEntity(input: Partial<Entity> & Pick<Entity, "id" | "kind" | "name">): Entity {
  return {
    description: null,
    isWishlist: false,
    tags: [{ id: 1, name: "tag-1" }],
    ...input
  };
}

function makeLocation(entityId: string): EntityLocationPin {
  return {
    id: entityId,
    kind: { id: 1, label: "場所" },
    name: `${entityId}-name`,
    tags: [],
    location: { latitude: 35.0, longitude: 139.0 }
  };
}

describe("registration-check", () => {
  it("場所の緯度経度漏れと画像漏れを抽出できる", () => {
    const entities: Entity[] = [
      makeEntity({
        id: "place-complete",
        kind: { id: 1, label: "場所" },
        name: "場所 完了",
        firstImageUrl: "/api/entities/place-complete/images/image-1/file"
      }),
      makeEntity({
        id: "place-missing-location",
        kind: { id: 1, label: "場所" },
        name: "場所 位置未登録",
        firstImageUrl: "/api/entities/place-missing-location/images/image-1/file"
      }),
      makeEntity({
        id: "item-missing-image",
        kind: { id: 2, label: "商品" },
        name: "商品 画像未登録",
        firstImageUrl: null
      }),
      makeEntity({
        id: "experience-missing-tag",
        kind: { id: 3, label: "体験" },
        name: "体験 タグ未設定",
        firstImageUrl: "/api/entities/experience-missing-tag/images/image-1/file",
        tags: []
      }),
      makeEntity({
        id: "wishlist-missing-all",
        kind: { id: 1, label: "場所" },
        name: "気になる 除外対象",
        isWishlist: true,
        firstImageUrl: null,
        tags: []
      })
    ];
    const locations: EntityLocationPin[] = [makeLocation("place-complete")];

    const result = buildRegistrationCheckResult(entities, locations);

    expect(result.checkedEntities.map((entity) => entity.id)).toEqual([
      "place-complete",
      "place-missing-location",
      "item-missing-image",
      "experience-missing-tag"
    ]);
    expect(result.missingLocationEntities.map((entity) => entity.id)).toEqual(["place-missing-location"]);
    expect(result.missingImageEntities.map((entity) => entity.id)).toEqual(["item-missing-image"]);
    expect(result.missingTagEntities.map((entity) => entity.id)).toEqual(["experience-missing-tag"]);
    expect(result.completeEntities.map((entity) => entity.id)).toEqual(["place-complete"]);
  });
});
