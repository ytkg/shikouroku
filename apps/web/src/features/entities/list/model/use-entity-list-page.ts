import { useEffect, useMemo, useState } from "react";
import type { Entity } from "@/entities/entity";
import { useEntitiesQuery } from "@/entities/entity";
import { useAuthGuard } from "@/features/auth";
import { type EntityTab, getKindTabs, getVisibleEntities } from "./entity-list";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

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
    const nextError = resolveQueryError({
      queryError,
      ensureAuthorized
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
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
