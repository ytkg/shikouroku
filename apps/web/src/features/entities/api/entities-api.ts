import type { Entity, Kind, Tag } from "@/features/entities/model/entity-types";

type ApiEntity = {
  id: string;
  kind_id: number;
  kind?: Kind;
  name: string;
  description: string | null;
  is_wishlist: number;
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toEntity(apiEntity: ApiEntity): Entity {
  return {
    id: apiEntity.id,
    kindId: apiEntity.kind_id,
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
  const res = await fetch("/api/kinds");
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { ok: boolean; kinds: Kind[] };
  return json.kinds;
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/tags");
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { ok: boolean; tags: Tag[] };
  return json.tags;
}

export async function createTag(input: { name: string }): Promise<Tag> {
  const res = await fetch("/api/tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const json = (await res.json()) as { message?: string };
    throw new ApiError(res.status, json.message ?? `HTTP ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; tag: Tag };
  return json.tag;
}

export async function deleteTag(tagId: number): Promise<void> {
  const res = await fetch(`/api/tags/${tagId}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const json = (await res.json()) as { message?: string };
    throw new ApiError(res.status, json.message ?? `HTTP ${res.status}`);
  }
}

export async function fetchEntities(): Promise<Entity[]> {
  const res = await fetch("/api/entities");
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { ok: boolean; entities: ApiEntity[] };
  return json.entities.map(toEntity);
}

export async function fetchEntityById(entityId: string): Promise<Entity> {
  const res = await fetch(`/api/entities/${entityId}`);
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { ok: boolean; entity: ApiEntity };
  return toEntity(json.entity);
}

export async function createEntity(input: {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
}): Promise<Entity> {
  const res = await fetch("/api/entities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const json = (await res.json()) as { message?: string };
    throw new ApiError(res.status, json.message ?? `HTTP ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; entity: ApiEntity };
  return toEntity(json.entity);
}

export async function updateEntity(
  entityId: string,
  input: {
    kindId: number;
    name: string;
    description: string;
    isWishlist: boolean;
    tagIds: number[];
  }
): Promise<Entity> {
  const res = await fetch(`/api/entities/${entityId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const json = (await res.json()) as { message?: string };
    throw new ApiError(res.status, json.message ?? `HTTP ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; entity: ApiEntity };
  return toEntity(json.entity);
}
