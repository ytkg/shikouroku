import type { Entity } from "../model/entity.types";
import type { EntitiesPageResponse } from "./entities.response";
import { apiPaths } from "@/shared/config/api-paths";

export const ENTITY_SEARCH_FIELDS = ["title", "body", "tags"] as const;
export type EntitySearchField = (typeof ENTITY_SEARCH_FIELDS)[number];

export const ENTITY_SEARCH_MATCHES = ["partial", "prefix", "exact"] as const;
export type EntitySearchMatch = (typeof ENTITY_SEARCH_MATCHES)[number];

export const ENTITY_WISHLIST_FILTERS = ["include", "exclude", "only"] as const;
export type EntityWishlistFilter = (typeof ENTITY_WISHLIST_FILTERS)[number];

const DEFAULT_ENTITY_PAGE_LIMIT = 20;
export const MAX_ENTITY_PAGE_LIMIT = 100;

export type FetchEntitiesPageInput = {
  q?: string;
  fields?: EntitySearchField[];
  match?: EntitySearchMatch;
  kindId?: number | null;
  wishlist?: EntityWishlistFilter;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
};

function normalizeEntitySearchFields(fields: EntitySearchField[] | undefined): EntitySearchField[] {
  if (!fields || fields.length === 0) {
    return [...ENTITY_SEARCH_FIELDS];
  }

  const inputSet = new Set(fields);
  return ENTITY_SEARCH_FIELDS.filter((field) => inputSet.has(field));
}

function normalizeEntityPageLimit(limit: number | undefined): number {
  if (!limit || !Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_ENTITY_PAGE_LIMIT;
  }

  return Math.min(limit, MAX_ENTITY_PAGE_LIMIT);
}

export function buildEntitiesListPath(input: FetchEntitiesPageInput): string {
  const query = input.q?.trim() ?? "";
  const fields = normalizeEntitySearchFields(input.fields);
  const match = input.match ?? "partial";
  const limit = normalizeEntityPageLimit(input.limit);
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(limit));

  if (query.length > 0) {
    searchParams.set("q", query);
  }

  if (match !== "partial") {
    searchParams.set("match", match);
  }

  if (fields.length !== ENTITY_SEARCH_FIELDS.length) {
    searchParams.set("fields", fields.join(","));
  }

  if (input.kindId && Number.isInteger(input.kindId) && input.kindId > 0) {
    searchParams.set("kindId", String(input.kindId));
  }

  if (input.wishlist && input.wishlist !== "include") {
    searchParams.set("wishlist", input.wishlist);
  }

  if (input.cursor) {
    searchParams.set("cursor", input.cursor);
  }

  return `${apiPaths.entities}?${searchParams.toString()}`;
}

export async function collectAllEntities(
  fetchPage: (cursor: string | null) => Promise<EntitiesPageResponse>
): Promise<Entity[]> {
  const entities: Entity[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  while (true) {
    const page = await fetchPage(cursor);
    entities.push(...page.entities);

    if (!page.page.hasMore || !page.page.nextCursor) {
      return entities;
    }

    if (seenCursors.has(page.page.nextCursor)) {
      return entities;
    }

    seenCursors.add(page.page.nextCursor);
    cursor = page.page.nextCursor;
  }
}
