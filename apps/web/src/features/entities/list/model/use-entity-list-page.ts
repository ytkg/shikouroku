import { useEffect, useMemo, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import type { Entity } from "@/features/entities/model/entity-types";
import {
  type EntityTab,
  getKindTabs,
  getVisibleEntities
} from "@/features/entities/list/model/entity-list";
import { useEntitiesQuery } from "@/features/entities/model/entity.query";
import { ApiError } from "@/shared/api/api-error";

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

  const kindTabs = useMemo(() => getKindTabs(entities), [entities]);

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
