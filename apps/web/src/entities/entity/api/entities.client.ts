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
  return collectAllEntities((cursor) =>
    fetchEntitiesPage({
      limit: MAX_ENTITY_PAGE_LIMIT,
      cursor
    })
  );
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
