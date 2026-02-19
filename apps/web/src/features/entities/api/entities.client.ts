import {
  parseEntitiesResponse,
  parseEntityResponse,
  parseKindsResponse,
  parseOkResponse,
  parseTagResponse,
  parseTagsResponse
} from "@/features/entities/api/entities.response";
import type { Entity, Kind, Tag } from "@/features/entities/model/entity-types";
import { requestJson } from "@/shared/api/http.client";
import { apiPaths, getEntityPath, getTagPath } from "@/shared/config/api-paths";

export type CreateTagInput = {
  name: string;
};

export type CreateEntityInput = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
};

export type UpdateEntityInput = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
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

export async function fetchEntities(): Promise<Entity[]> {
  const json = await requestJson<unknown>(apiPaths.entities);
  return parseEntitiesResponse(json);
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
