import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type NavigateOptions, useSearchParams } from "react-router-dom";
import {
  fetchEntitiesPage,
  type Entity,
  type Kind,
  type EntitySearchField,
  type EntitySearchMatch,
  useKindsQuery
} from "@/entities/entity";
import { useAuthGuard } from "@/features/auth";
import { createEntityListAsyncGuard } from "./entity-list-async-guard";
import {
  parseEntityListSearchCriteria,
  setEntityKindTabParams,
  setEntitySearchFieldsParam,
  setEntitySearchMatchParam,
  setEntitySearchQueryParam,
  toggleEntitySearchFieldSelection,
  toEntityListCriteriaKey,
  type EntityKindTab
} from "./entity-list";
import { buildEntityListFetchInput } from "./entity-list-page-controller";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

const SEARCH_DEBOUNCE_MS = 300;

type SearchParamsMutator = (searchParams: URLSearchParams) => void;

type EntityListPageResult = {
  error: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  entities: Entity[];
  kinds: Kind[];
  query: string;
  selectedKindTab: EntityKindTab;
  match: EntitySearchMatch;
  selectedFields: EntitySearchField[];
  isAllFieldsSelected: boolean;
  totalCount: number;
  hasMore: boolean;
  setQuery: (query: string) => void;
  startQueryComposition: () => void;
  endQueryComposition: () => void;
  setSelectedKindTab: (tab: EntityKindTab) => void;
  setMatch: (match: EntitySearchMatch) => void;
  setSelectedFields: (fields: EntitySearchField[]) => void;
  toggleField: (field: EntitySearchField) => void;
  loadMore: () => Promise<void>;
};

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export function useEntityListPage(): EntityListPageResult {
  const ensureAuthorized = useAuthGuard();
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: kinds = [] } = useKindsQuery();

  const criteria = useMemo(() => parseEntityListSearchCriteria(searchParams), [searchParams]);
  const { rawQuery, selectedKindTab, match, selectedFields, isAllFieldsSelected } = criteria;
  const criteriaKey = useMemo(() => toEntityListCriteriaKey(criteria), [criteria]);

  const [queryInput, setQueryInput] = useState(rawQuery);
  const [isQueryComposing, setIsQueryComposing] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const asyncGuard = useRef(createEntityListAsyncGuard(criteriaKey));
  asyncGuard.current.sync(criteriaKey);

  const updateSearchParams = useCallback(
    (mutate: SearchParamsMutator, options?: NavigateOptions) => {
      setSearchParams(
        (currentSearchParams) => {
          const before = currentSearchParams.toString();
          const nextSearchParams = new URLSearchParams(currentSearchParams);
          mutate(nextSearchParams);
          return nextSearchParams.toString() === before ? currentSearchParams : nextSearchParams;
        },
        options
      );
    },
    [setSearchParams]
  );

  const fetchPage = useCallback(
    (input: { cursor?: string | null; signal?: AbortSignal } = {}) =>
      fetchEntitiesPage(buildEntityListFetchInput(criteria, input)),
    [criteria]
  );

  useEffect(() => {
    setQueryInput(rawQuery);
  }, [rawQuery]);

  useEffect(() => {
    if (isQueryComposing) {
      return;
    }

    if (queryInput === rawQuery) {
      return;
    }

    const timer = setTimeout(() => {
      updateSearchParams(
        (nextSearchParams) => {
          setEntitySearchQueryParam(nextSearchParams, queryInput);
        },
        { replace: true }
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isQueryComposing, queryInput, rawQuery, updateSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const currentCriteriaKey = criteriaKey;

    setIsLoading(true);
    setError(null);
    setIsLoadingMore(false);

    fetchPage({ signal: controller.signal })
      .then((response) => {
        asyncGuard.current.runIfCurrent(currentCriteriaKey, () => {
          setEntities(response.entities);
          setHasMore(response.page.hasMore);
          setNextCursor(response.page.nextCursor);
          setTotalCount(response.page.total);
        });
      })
      .catch((queryError) => {
        if (isAbortError(queryError)) {
          return;
        }

        asyncGuard.current.runIfCurrent(currentCriteriaKey, () => {
          const nextError = resolveQueryError({
            queryError,
            ensureAuthorized
          });
          if (nextError !== KEEP_CURRENT_ERROR) {
            setError(nextError);
          }
          setEntities([]);
          setHasMore(false);
          setNextCursor(null);
          setTotalCount(0);
        });
      })
      .finally(() => {
        asyncGuard.current.runIfCurrent(currentCriteriaKey, () => {
          setIsLoading(false);
        });
      });

    return () => {
      controller.abort();
    };
  }, [criteriaKey, ensureAuthorized, fetchPage]);

  const setMatch = useCallback(
    (nextMatch: EntitySearchMatch) => {
      updateSearchParams((nextSearchParams) => {
        setEntitySearchMatchParam(nextSearchParams, nextMatch);
      });
    },
    [updateSearchParams]
  );

  const setSelectedKindTab = useCallback(
    (nextTab: EntityKindTab) => {
      updateSearchParams((nextSearchParams) => {
        setEntityKindTabParams(nextSearchParams, nextTab);
      });
    },
    [updateSearchParams]
  );

  const setSelectedFields = useCallback(
    (fields: EntitySearchField[]) => {
      updateSearchParams((nextSearchParams) => {
        setEntitySearchFieldsParam(nextSearchParams, fields);
      });
    },
    [updateSearchParams]
  );

  const toggleField = useCallback(
    (field: EntitySearchField) => {
      setSelectedFields(toggleEntitySearchFieldSelection(selectedFields, field, isAllFieldsSelected));
    },
    [isAllFieldsSelected, selectedFields, setSelectedFields]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) {
      return;
    }

    const currentCriteriaKey = criteriaKey;
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await fetchPage({ cursor: nextCursor });
      asyncGuard.current.runIfCurrent(currentCriteriaKey, () => {
        setEntities((previousEntities) => [...previousEntities, ...response.entities]);
        setHasMore(response.page.hasMore);
        setNextCursor(response.page.nextCursor);
        setTotalCount(response.page.total);
      });
    } catch (queryError) {
      asyncGuard.current.runIfCurrent(currentCriteriaKey, () => {
        const nextError = resolveQueryError({
          queryError,
          ensureAuthorized
        });
        if (nextError !== KEEP_CURRENT_ERROR) {
          setError(nextError);
        }
      });
    } finally {
      if (asyncGuard.current.isCurrent(currentCriteriaKey)) {
        setIsLoadingMore(false);
      }
    }
  }, [criteriaKey, ensureAuthorized, fetchPage, hasMore, isLoadingMore, nextCursor]);

  return {
    error,
    isLoading,
    isLoadingMore,
    entities,
    kinds,
    query: queryInput,
    selectedKindTab,
    match,
    selectedFields,
    isAllFieldsSelected,
    totalCount,
    hasMore,
    setQuery: setQueryInput,
    startQueryComposition: () => setIsQueryComposing(true),
    endQueryComposition: () => setIsQueryComposing(false),
    setSelectedKindTab,
    setMatch,
    setSelectedFields,
    toggleField,
    loadMore
  };
}
