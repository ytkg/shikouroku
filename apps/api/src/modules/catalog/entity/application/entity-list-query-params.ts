import {
  ENTITY_SEARCH_FIELDS,
  ENTITY_SEARCH_MATCHES,
  ENTITY_WISHLIST_FILTERS,
  type EntityListCursor,
  type EntitySearchField,
  type EntitySearchMatch,
  type EntityWishlistFilter,
  type ListEntitiesQueryInput
} from "./list-entities-query";

const DEFAULT_ENTITY_LIMIT = 20;
const MAX_ENTITY_LIMIT = 100;
const ENTITY_SEARCH_MATCH_SET = new Set<string>(ENTITY_SEARCH_MATCHES);
const ENTITY_SEARCH_FIELD_SET = new Set<string>(ENTITY_SEARCH_FIELDS);
const ENTITY_WISHLIST_FILTER_SET = new Set<string>(ENTITY_WISHLIST_FILTERS);

export type RawEntityListQueryParams = {
  limit?: string;
  cursor?: string;
  match?: string;
  fields?: string;
  kindId?: string;
  wishlist?: string;
  q?: string;
};

export type EntityListQueryParamsErrorCode =
  | "INVALID_ENTITY_LIMIT"
  | "INVALID_ENTITY_CURSOR"
  | "INVALID_ENTITY_MATCH"
  | "INVALID_ENTITY_FIELDS"
  | "INVALID_ENTITY_KIND_ID"
  | "INVALID_ENTITY_WISHLIST";

export type EntityListQueryParamsError = {
  code: EntityListQueryParamsErrorCode;
  message: string;
};

export type ResolvedEntityListQueryParams = Pick<
  ListEntitiesQueryInput,
  "limit" | "cursor" | "kindId" | "wishlist" | "q" | "match" | "fields"
>;

export type ResolveEntityListQueryParamsResult =
  | {
      ok: true;
      data: ResolvedEntityListQueryParams;
    }
  | {
      ok: false;
      error: EntityListQueryParamsError;
    };

function resolveEntityLimit(raw: string | undefined): number | null {
  if (!raw) {
    return DEFAULT_ENTITY_LIMIT;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > MAX_ENTITY_LIMIT) {
    return null;
  }

  return value;
}

function resolveEntityKindId(raw: string | undefined): number | null | "invalid" {
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return "invalid";
  }

  return value;
}

function decodeURIComponentSafely(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function resolveEntityCursor(raw: string | undefined): EntityListCursor | null | "invalid" {
  if (!raw) {
    return null;
  }

  const parts = raw.split(":");
  if (parts.length !== 2) {
    return "invalid";
  }

  const createdAt = decodeURIComponentSafely(parts[0] ?? "");
  const id = decodeURIComponentSafely(parts[1] ?? "");
  if (!createdAt || !id) {
    return "invalid";
  }

  return { createdAt, id };
}

function resolveEntitySearchMatch(raw: string | undefined): EntitySearchMatch | null {
  if (!raw) {
    return "partial";
  }

  return ENTITY_SEARCH_MATCH_SET.has(raw) ? (raw as EntitySearchMatch) : null;
}

function resolveEntitySearchFields(raw: string | undefined): EntitySearchField[] | null {
  if (!raw) {
    return [...ENTITY_SEARCH_FIELDS];
  }

  const fields = [...new Set(raw.split(",").map((field) => field.trim()).filter((field) => field.length > 0))];
  if (fields.length === 0) {
    return null;
  }

  if (fields.some((field) => !ENTITY_SEARCH_FIELD_SET.has(field))) {
    return null;
  }

  return fields as EntitySearchField[];
}

function resolveEntityWishlistFilter(raw: string | undefined): EntityWishlistFilter | null {
  if (!raw) {
    return "include";
  }

  return ENTITY_WISHLIST_FILTER_SET.has(raw) ? (raw as EntityWishlistFilter) : null;
}

export function resolveEntityListQueryParams(
  query: RawEntityListQueryParams
): ResolveEntityListQueryParamsResult {
  const limit = resolveEntityLimit(query.limit);
  if (!limit) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENTITY_LIMIT",
        message: "limit must be an integer between 1 and 100"
      }
    };
  }

  const cursor = resolveEntityCursor(query.cursor);
  if (cursor === "invalid") {
    return {
      ok: false,
      error: {
        code: "INVALID_ENTITY_CURSOR",
        message: "cursor must be in a valid format"
      }
    };
  }

  const match = resolveEntitySearchMatch(query.match);
  if (!match) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENTITY_MATCH",
        message: "match must be one of partial, prefix, exact"
      }
    };
  }

  const fields = resolveEntitySearchFields(query.fields);
  if (!fields) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENTITY_FIELDS",
        message: "fields must include at least one of title, body, tags"
      }
    };
  }

  const kindId = resolveEntityKindId(query.kindId);
  if (kindId === "invalid") {
    return {
      ok: false,
      error: {
        code: "INVALID_ENTITY_KIND_ID",
        message: "kindId must be a positive integer"
      }
    };
  }

  const wishlist = resolveEntityWishlistFilter(query.wishlist);
  if (!wishlist) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENTITY_WISHLIST",
        message: "wishlist must be one of include, exclude, only"
      }
    };
  }

  return {
    ok: true,
    data: {
      limit,
      cursor,
      kindId,
      wishlist,
      q: query.q ?? "",
      match,
      fields
    }
  };
}
