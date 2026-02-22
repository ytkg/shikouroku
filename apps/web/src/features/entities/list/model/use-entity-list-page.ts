import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Entity } from "@/entities/entity";
import { useEntitiesQuery } from "@/entities/entity";
import { useAuthGuard } from "@/features/auth";
import {
  defaultEntityTab,
  entityTabQueryKey,
  type EntityTab,
  getKindTabs,
  getVisibleEntities,
  parseEntityTab
} from "./entity-list";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get(entityTabQueryKey);
  const selectedTab = parseEntityTab(rawTab);
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

  useEffect(() => {
    const normalizedTab = selectedTab === defaultEntityTab ? null : selectedTab;
    if (rawTab === normalizedTab) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    if (normalizedTab === null) {
      nextSearchParams.delete(entityTabQueryKey);
    } else {
      nextSearchParams.set(entityTabQueryKey, normalizedTab);
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [rawTab, selectedTab, searchParams, setSearchParams]);

  const kindTabs = useMemo(() => getKindTabs(entities), [entities]);

  const filteredEntities = useMemo(
    () => getVisibleEntities(entities, selectedTab),
    [entities, selectedTab]
  );

  const setSelectedTab = useCallback(
    (tab: EntityTab) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      if (tab === defaultEntityTab) {
        nextSearchParams.delete(entityTabQueryKey);
      } else {
        nextSearchParams.set(entityTabQueryKey, tab);
      }
      setSearchParams(nextSearchParams);
    },
    [searchParams, setSearchParams]
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
