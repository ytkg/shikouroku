import {
  ENTITY_SEARCH_FIELDS,
  ENTITY_SEARCH_MATCHES,
  ENTITY_WISHLIST_FILTERS,
  type EntitySearchField,
  type EntitySearchMatch,
  type EntityWishlistFilter
} from "@/entities/entity";

export const entitySearchQueryKey = "q";
export const entitySearchMatchQueryKey = "match";
export const entitySearchFieldsQueryKey = "fields";
export const entityKindFilterQueryKey = "kindId";
export const entityWishlistFilterQueryKey = "wishlist";

export const defaultEntitySearchMatch: EntitySearchMatch = "partial";
export const defaultEntitySearchFields: EntitySearchField[] = [...ENTITY_SEARCH_FIELDS];
export const defaultEntityWishlistFilter: EntityWishlistFilter = "exclude";
export type EntityKindTab = "all" | "wishlist" | `kind-${number}`;
export type EntityListSearchCriteria = {
  rawQuery: string;
  kindId: number | null;
  wishlistFilter: EntityWishlistFilter;
  selectedKindTab: EntityKindTab;
  match: EntitySearchMatch;
  selectedFields: EntitySearchField[];
  isAllFieldsSelected: boolean;
};

export function parseEntitySearchMatch(value: string | null | undefined): EntitySearchMatch {
  if (!value) {
    return defaultEntitySearchMatch;
  }

  return ENTITY_SEARCH_MATCHES.includes(value as EntitySearchMatch)
    ? (value as EntitySearchMatch)
    : defaultEntitySearchMatch;
}

export function parseEntitySearchFields(value: string | null | undefined): EntitySearchField[] {
  if (!value) {
    return [...defaultEntitySearchFields];
  }

  const requestedFields = new Set(
    value
      .split(",")
      .map((field) => field.trim())
      .filter((field) => field.length > 0)
  );
  const normalizedFields = normalizeEntitySearchFieldsSelection([...requestedFields]);

  return normalizedFields.length > 0 ? normalizedFields : [...defaultEntitySearchFields];
}

export function toEntitySearchFieldsParam(fields: EntitySearchField[]): string | null {
  const normalizedFields = normalizeEntitySearchFieldsSelection(fields);
  if (normalizedFields.length === 0 || normalizedFields.length === ENTITY_SEARCH_FIELDS.length) {
    return null;
  }

  return normalizedFields.join(",");
}

export function normalizeEntitySearchFieldsSelection(
  fields: ReadonlyArray<string>
): EntitySearchField[] {
  const selected = new Set(fields);
  return ENTITY_SEARCH_FIELDS.filter((field) => selected.has(field));
}

export function toggleEntitySearchFieldSelection(
  currentFields: ReadonlyArray<EntitySearchField>,
  toggledField: EntitySearchField,
  isAllFieldsSelected: boolean
): EntitySearchField[] {
  if (isAllFieldsSelected) {
    return [toggledField];
  }

  const selected = new Set(currentFields);
  if (selected.has(toggledField)) {
    if (selected.size === 1) {
      return [...ENTITY_SEARCH_FIELDS];
    }
    selected.delete(toggledField);
  } else {
    selected.add(toggledField);
  }

  return normalizeEntitySearchFieldsSelection([...selected]);
}

export function parseEntityListSearchCriteria(searchParams: URLSearchParams): EntityListSearchCriteria {
  const rawQuery = searchParams.get(entitySearchQueryKey) ?? "";
  const rawKindId = searchParams.get(entityKindFilterQueryKey);
  const rawWishlist = searchParams.get(entityWishlistFilterQueryKey);
  const rawMatch = searchParams.get(entitySearchMatchQueryKey);
  const rawFields = searchParams.get(entitySearchFieldsQueryKey);

  const kindId = parseEntityKindFilter(rawKindId);
  const wishlistFilter = parseEntityWishlistFilter(rawWishlist);
  const selectedKindTab = parseEntityKindTab(kindId, wishlistFilter);
  const match = parseEntitySearchMatch(rawMatch);
  const selectedFields = parseEntitySearchFields(rawFields);

  return {
    rawQuery,
    kindId,
    wishlistFilter,
    selectedKindTab,
    match,
    selectedFields,
    isAllFieldsSelected: selectedFields.length === ENTITY_SEARCH_FIELDS.length
  };
}

export function toEntityListCriteriaKey(criteria: EntityListSearchCriteria): string {
  return [
    criteria.rawQuery,
    criteria.kindId === null ? "all" : String(criteria.kindId),
    criteria.wishlistFilter,
    criteria.match,
    criteria.selectedFields.join(",")
  ].join("\n");
}

export function setEntitySearchQueryParam(searchParams: URLSearchParams, query: string): void {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) {
    searchParams.delete(entitySearchQueryKey);
    return;
  }

  searchParams.set(entitySearchQueryKey, normalizedQuery);
}

export function setEntitySearchMatchParam(
  searchParams: URLSearchParams,
  nextMatch: EntitySearchMatch
): void {
  if (nextMatch === defaultEntitySearchMatch) {
    searchParams.delete(entitySearchMatchQueryKey);
    return;
  }

  searchParams.set(entitySearchMatchQueryKey, nextMatch);
}

export function setEntityKindTabParams(searchParams: URLSearchParams, nextTab: EntityKindTab): void {
  if (nextTab === "all") {
    searchParams.delete(entityKindFilterQueryKey);
    searchParams.delete(entityWishlistFilterQueryKey);
    return;
  }

  if (nextTab === "wishlist") {
    searchParams.delete(entityKindFilterQueryKey);
    searchParams.set(entityWishlistFilterQueryKey, "only");
    return;
  }

  const nextKindId = Number(nextTab.slice("kind-".length));
  if (!Number.isInteger(nextKindId) || nextKindId <= 0) {
    searchParams.delete(entityKindFilterQueryKey);
  } else {
    searchParams.set(entityKindFilterQueryKey, String(nextKindId));
  }
  searchParams.delete(entityWishlistFilterQueryKey);
}

export function setEntitySearchFieldsParam(
  searchParams: URLSearchParams,
  fields: ReadonlyArray<string>
): boolean {
  const normalizedFields = normalizeEntitySearchFieldsSelection(fields);
  if (normalizedFields.length === 0) {
    return false;
  }

  const fieldParam = toEntitySearchFieldsParam(normalizedFields);
  if (fieldParam) {
    searchParams.set(entitySearchFieldsQueryKey, fieldParam);
  } else {
    searchParams.delete(entitySearchFieldsQueryKey);
  }

  return true;
}

export function setEntityTagFilterParams(searchParams: URLSearchParams, tagName: string): void {
  setEntitySearchQueryParam(searchParams, tagName);
  setEntitySearchFieldsParam(searchParams, ["tags"]);
  setEntitySearchMatchParam(searchParams, "exact");
}

export function parseEntityKindFilter(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const kindId = Number(value);
  if (!Number.isInteger(kindId) || kindId <= 0) {
    return null;
  }

  return kindId;
}

export function parseEntityWishlistFilter(value: string | null | undefined): EntityWishlistFilter {
  if (!value) {
    return defaultEntityWishlistFilter;
  }

  if (!ENTITY_WISHLIST_FILTERS.includes(value as EntityWishlistFilter)) {
    return defaultEntityWishlistFilter;
  }

  if (value === "only") {
    return "only";
  }

  return defaultEntityWishlistFilter;
}

export function toKindTab(kindId: number): `kind-${number}` {
  return `kind-${kindId}`;
}

export function parseEntityKindTab(
  kindId: number | null,
  wishlistFilter: EntityWishlistFilter
): EntityKindTab {
  if (wishlistFilter === "only") {
    return "wishlist";
  }

  if (kindId !== null) {
    return toKindTab(kindId);
  }

  return "all";
}
