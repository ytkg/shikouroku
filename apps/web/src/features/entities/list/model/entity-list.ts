import type { Entity } from "../../model/entity-types";

export type EntityTab = "all" | "wishlist" | `kind:${number}`;

type KindTab = {
  id: number;
  label: string;
};

export function toKindTab(kindId: number): `kind:${number}` {
  return `kind:${kindId}`;
}

export function getVisibleEntities(entities: Entity[], selectedTab: EntityTab): Entity[] {
  if (selectedTab === "wishlist") {
    return entities.filter((entity) => entity.isWishlist);
  }

  const nonWishlistEntities = entities.filter((entity) => !entity.isWishlist);
  if (selectedTab === "all") {
    return nonWishlistEntities;
  }

  const kindId = Number(selectedTab.slice("kind:".length));
  return nonWishlistEntities.filter((entity) => entity.kind.id === kindId);
}

export function getKindTabs(entities: Entity[]): KindTab[] {
  const kindMap = new Map<number, string>();

  for (const entity of entities) {
    if (entity.isWishlist) {
      continue;
    }

    if (!kindMap.has(entity.kind.id)) {
      kindMap.set(entity.kind.id, entity.kind.label);
    }
  }

  return Array.from(kindMap, ([id, label]) => ({ id, label })).sort((a, b) => a.id - b.id);
}
