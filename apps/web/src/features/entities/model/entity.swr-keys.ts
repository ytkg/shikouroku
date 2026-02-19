import { apiPaths, getEntityPath } from "@/shared/config/api-paths";

export const ENTITIES_KEY = apiPaths.entities;
export const KINDS_KEY = apiPaths.kinds;
export const TAGS_KEY = apiPaths.tags;

export function entityKey(entityId: string): string {
  return getEntityPath(entityId);
}

export function isEntityDetailKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(`${apiPaths.entities}/`);
}
