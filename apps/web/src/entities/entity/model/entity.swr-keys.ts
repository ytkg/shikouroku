import {
  apiPaths,
  getEntityImagesPath,
  getEntityPath,
  getEntityRelatedPath
} from "@/shared/config/api-paths";

export const ENTITIES_KEY = apiPaths.entities;
export const KINDS_KEY = apiPaths.kinds;
export const TAGS_KEY = apiPaths.tags;

export function entityKey(entityId: string): string {
  return getEntityPath(entityId);
}

export function relatedEntitiesKey(entityId: string): string {
  return getEntityRelatedPath(entityId);
}

export function entityImagesKey(entityId: string): string {
  return getEntityImagesPath(entityId);
}

export function isEntityDetailKey(key: unknown): key is string {
  if (typeof key !== "string") {
    return false;
  }

  const prefix = `${apiPaths.entities}/`;
  if (!key.startsWith(prefix)) {
    return false;
  }

  const entityIdSegment = key.slice(prefix.length);
  return entityIdSegment.length > 0 && !entityIdSegment.includes("/");
}

export function isEntityRelatedListKey(key: unknown): key is string {
  if (typeof key !== "string") {
    return false;
  }

  return key.endsWith("/related") && key.startsWith(`${apiPaths.entities}/`);
}

export function isEntityImagesListKey(key: unknown): key is string {
  if (typeof key !== "string") {
    return false;
  }

  return key.endsWith("/images") && key.startsWith(`${apiPaths.entities}/`);
}
