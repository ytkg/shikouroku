import type { Entity, Kind } from "@/features/entities/model/entity-types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
  const json = (await res.json()) as { ok: boolean; entities: Entity[] };
  return json.entities;
}

export async function fetchEntityById(entityId: string): Promise<Entity> {
  const res = await fetch(`/api/entities/${entityId}`);
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { ok: boolean; entity: Entity };
  return json.entity;
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

  const json = (await res.json()) as { ok: boolean; entity: Entity };
  return json.entity;
}
