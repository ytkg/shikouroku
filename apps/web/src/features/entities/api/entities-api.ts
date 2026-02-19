import type { Entity, Kind } from "@/features/entities/model/entity-types";

type ApiEntity = {
  id: string;
  kind_id: number;
  name: string;
  description: string | null;
  is_wishlist: number;
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
    name: apiEntity.name,
    description: apiEntity.description,
    isWishlist: apiEntity.is_wishlist === 1,
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
