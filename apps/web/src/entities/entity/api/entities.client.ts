import {
  parseEntityLocationsResponse,
  parseEntitiesPageResponse,
  parseEntityResponse,
  parseKindsResponse,
  parseOkResponse,
  parseTagResponse,
  parseTagsResponse,
  type EntitiesPageResponse
} from "./entities.response";
import type { Entity, EntityLocationPin, Kind, Tag } from "../model/entity.types";
import { requestJson } from "@/shared/api/http.client";
import { apiPaths, getEntityLocationsPath, getEntityPath, getTagPath } from "@/shared/config/api-paths";

export type CreateTagInput = {
  name: string;
};

export type CreateEntityInput = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
  latitude?: number;
  longitude?: number;
};

export type UpdateEntityInput = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
  latitude?: number;
  longitude?: number;
};

export const ENTITY_SEARCH_FIELDS = ["title", "body", "tags"] as const;
export type EntitySearchField = (typeof ENTITY_SEARCH_FIELDS)[number];

export const ENTITY_SEARCH_MATCHES = ["partial", "prefix", "exact"] as const;
export type EntitySearchMatch = (typeof ENTITY_SEARCH_MATCHES)[number];

export const ENTITY_WISHLIST_FILTERS = ["include", "exclude", "only"] as const;
export type EntityWishlistFilter = (typeof ENTITY_WISHLIST_FILTERS)[number];

const DEFAULT_ENTITY_PAGE_LIMIT = 20;
const MAX_ENTITY_PAGE_LIMIT = 100;

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

function buildEntitiesListPath(input: FetchEntitiesPageInput): string {
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

export async function fetchKinds(): Promise<Kind[]> {
  const json = await requestJson<unknown>(apiPaths.kinds);
  return parseKindsResponse(json);
}

export async function fetchTags(): Promise<Tag[]> {
  const json = await requestJson<unknown>(apiPaths.tags);
  return parseTagsResponse(json);
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const json = await requestJson<unknown>(apiPaths.tags, {
    method: "POST",
    body: input
  });
  return parseTagResponse(json);
}

export async function deleteTag(tagId: number): Promise<void> {
  const json = await requestJson<unknown>(getTagPath(tagId), {
    method: "DELETE"
  });
  parseOkResponse(json);
}

export async function fetchEntitiesPage(
  input: FetchEntitiesPageInput = {}
): Promise<EntitiesPageResponse> {
  const json = await requestJson<unknown>(buildEntitiesListPath(input), {
    signal: input.signal
  });
  return parseEntitiesPageResponse(json);
}

export async function fetchEntities(): Promise<Entity[]> {
  const entities: Entity[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  while (true) {
    const page = await fetchEntitiesPage({
      limit: MAX_ENTITY_PAGE_LIMIT,
      cursor
    });
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

export async function fetchEntityLocations(): Promise<EntityLocationPin[]> {
  const json = await requestJson<unknown>(getEntityLocationsPath());
  return parseEntityLocationsResponse(json).locations;
}

export async function fetchEntityById(entityId: string): Promise<Entity> {
  const json = await requestJson<unknown>(getEntityPath(entityId));
  return parseEntityResponse(json);
}

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  const json = await requestJson<unknown>(apiPaths.entities, {
    method: "POST",
    body: input
  });
  return parseEntityResponse(json);
}

export async function updateEntity(
  entityId: string,
  input: UpdateEntityInput
): Promise<Entity> {
  const json = await requestJson<unknown>(getEntityPath(entityId), {
    method: "PATCH",
    body: input
  });
  return parseEntityResponse(json);
}
