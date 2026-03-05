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
import { requestJson, type JsonRequestInit } from "@/shared/api/http.client";
import { apiPaths, getEntityLocationsPath, getEntityPath, getTagPath } from "@/shared/config/api-paths";
import {
  buildEntitiesListPath,
  collectAllEntities,
  ENTITY_SEARCH_FIELDS,
  ENTITY_SEARCH_MATCHES,
  ENTITY_WISHLIST_FILTERS,
  MAX_ENTITY_PAGE_LIMIT,
  type EntitySearchField,
  type EntitySearchMatch,
  type EntityWishlistFilter,
  type FetchEntitiesPageInput
} from "./entities-client-helpers";

export { ENTITY_SEARCH_FIELDS, ENTITY_SEARCH_MATCHES, ENTITY_WISHLIST_FILTERS };
export type {
  EntitySearchField,
  EntitySearchMatch,
  EntityWishlistFilter,
  FetchEntitiesPageInput
};

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

async function requestAndParse<T>(
  path: string,
  parser: (json: unknown) => T,
  init?: JsonRequestInit
): Promise<T> {
  const json = await requestJson<unknown>(path, init);
  return parser(json);
}

async function requestAndParseEntity(
  path: string,
  init?: JsonRequestInit
): Promise<Entity> {
  return requestAndParse(path, parseEntityResponse, init);
}

export async function fetchKinds(): Promise<Kind[]> {
  return requestAndParse(apiPaths.kinds, parseKindsResponse);
}

export async function fetchTags(): Promise<Tag[]> {
  return requestAndParse(apiPaths.tags, parseTagsResponse);
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  return requestAndParse(apiPaths.tags, parseTagResponse, {
    method: "POST",
    body: input
  });
}

export async function deleteTag(tagId: number): Promise<void> {
  await requestAndParse(getTagPath(tagId), parseOkResponse, {
    method: "DELETE"
  });
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
  return collectAllEntities((cursor) =>
    fetchEntitiesPage({
      limit: MAX_ENTITY_PAGE_LIMIT,
      cursor
    })
  );
}

export async function fetchEntityLocations(): Promise<EntityLocationPin[]> {
  return requestAndParse(getEntityLocationsPath(), (json) => parseEntityLocationsResponse(json).locations);
}

export async function fetchEntityById(entityId: string): Promise<Entity> {
  return requestAndParseEntity(getEntityPath(entityId));
}

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  return requestAndParseEntity(apiPaths.entities, {
    method: "POST",
    body: input
  });
}

export async function updateEntity(
  entityId: string,
  input: UpdateEntityInput
): Promise<Entity> {
  return requestAndParseEntity(getEntityPath(entityId), {
    method: "PATCH",
    body: input
  });
}
