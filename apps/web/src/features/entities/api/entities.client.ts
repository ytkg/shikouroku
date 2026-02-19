import type { Entity, Kind, Tag } from "@/features/entities/model/entity-types";
import { requestJson } from "@/shared/api/http.client";

type ApiEntity = {
  id: string;
  kind: Kind;
  name: string;
  description: string | null;
  is_wishlist: number;
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
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
};

export type UpdateEntityInput = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
};

type KindsResponse = {
  ok: boolean;
  kinds: Kind[];
};

type TagsResponse = {
  ok: boolean;
  tags: Tag[];
};

type TagResponse = {
  ok: boolean;
  tag: Tag;
};

type EntitiesResponse = {
  ok: boolean;
  entities: ApiEntity[];
};

type EntityResponse = {
  ok: boolean;
  entity: ApiEntity;
};

type OkResponse = {
  ok: boolean;
};

function toEntity(apiEntity: ApiEntity): Entity {
  return {
    id: apiEntity.id,
    kind: apiEntity.kind,
    name: apiEntity.name,
    description: apiEntity.description,
    isWishlist: apiEntity.is_wishlist === 1,
    tags: apiEntity.tags ?? [],
    createdAt: apiEntity.created_at,
    updatedAt: apiEntity.updated_at
  };
}

export async function fetchKinds(): Promise<Kind[]> {
  const json = await requestJson<KindsResponse>("/api/kinds");
  return json.kinds;
}

export async function fetchTags(): Promise<Tag[]> {
  const json = await requestJson<TagsResponse>("/api/tags");
  return json.tags;
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const json = await requestJson<TagResponse>("/api/tags", {
    method: "POST",
    body: input
  });
  return json.tag;
}

export async function deleteTag(tagId: number): Promise<void> {
  await requestJson<OkResponse>(`/api/tags/${tagId}`, {
    method: "DELETE"
  });
}

export async function fetchEntities(): Promise<Entity[]> {
  const json = await requestJson<EntitiesResponse>("/api/entities");
  return json.entities.map(toEntity);
}

export async function fetchEntityById(entityId: string): Promise<Entity> {
  const json = await requestJson<EntityResponse>(`/api/entities/${entityId}`);
  return toEntity(json.entity);
}

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  const json = await requestJson<EntityResponse>("/api/entities", {
    method: "POST",
    body: input
  });
  return toEntity(json.entity);
}

export async function updateEntity(
  entityId: string,
  input: UpdateEntityInput
): Promise<Entity> {
  const json = await requestJson<EntityResponse>(`/api/entities/${entityId}`, {
    method: "PATCH",
    body: input
  });
  return toEntity(json.entity);
}
