import { useEffect, useMemo, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import type { Entity } from "@/features/entities/model/entity-types";
import { useEntitiesQuery } from "@/features/entities/model/use-entities-api";
import { ApiError } from "@/shared/api/api-error";

export type EntityTab = "all" | "wishlist" | `kind:${number}`;

type KindTab = {
  id: number;
  label: string;
};

type EntityListPageResult = {
  error: string | null;
  isLoading: boolean;
  selectedTab: EntityTab;
  kindTabs: KindTab[];
  filteredEntities: Entity[];
  setSelectedTab: (tab: EntityTab) => void;
};

export function toKindTab(kindId: number): `kind:${number}` {
  return `kind:${kindId}`;
}

function getVisibleEntities(entities: Entity[], selectedTab: EntityTab): Entity[] {
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

export function useEntityListPage(): EntityListPageResult {
  const ensureAuthorized = useAuthGuard();
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<EntityTab>("all");
  const { data: entities = [], error: queryError, isLoading } = useEntitiesQuery();

  useEffect(() => {
    if (!queryError) {
      setError(null);
      return;
    }

    if (queryError instanceof ApiError && !ensureAuthorized(queryError.status)) {
      return;
    }

    setError(queryError instanceof Error ? queryError.message : "unknown error");
  }, [queryError, ensureAuthorized]);

  const kindTabs = useMemo(() => {
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
  }, [entities]);

  const filteredEntities = useMemo(
    () => getVisibleEntities(entities, selectedTab),
    [entities, selectedTab]
  );

  return {
    error,
    isLoading,
    selectedTab,
    kindTabs,
    filteredEntities,
    setSelectedTab
  };
}
