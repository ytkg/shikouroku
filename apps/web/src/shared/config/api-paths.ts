import { encodePathSegment } from "@/shared/lib/url";

export const apiPaths = {
  authMe: "/api/auth/me",
  login: "/api/login",
  logout: "/api/logout",
  kinds: "/api/kinds",
  tags: "/api/tags",
  entities: "/api/entities",
  maintenanceImageCleanupTasks: "/api/maintenance/image-cleanup/tasks"
} as const;

export function getTagPath(tagId: number): string {
  return `${apiPaths.tags}/${tagId}`;
}

export function getEntityPath(entityId: string): string {
  return `${apiPaths.entities}/${encodePathSegment(entityId)}`;
}

export function getEntityLocationsPath(): string {
  return `${apiPaths.entities}/locations`;
}

export function getEntityRelatedPath(entityId: string): string {
  return `${getEntityPath(entityId)}/related`;
}

export function getEntityRelationPath(entityId: string, relatedEntityId: string): string {
  return `${getEntityRelatedPath(entityId)}/${encodePathSegment(relatedEntityId)}`;
}

export function getEntityImagesPath(entityId: string): string {
  return `${getEntityPath(entityId)}/images`;
}

export function getEntityImagePath(entityId: string, imageId: string): string {
  return `${getEntityImagesPath(entityId)}/${encodePathSegment(imageId)}`;
}

export function getEntityImageFilePath(entityId: string, imageId: string): string {
  return `${getEntityImagePath(entityId, imageId)}/file`;
}

export function getEntityImageOrderPath(entityId: string): string {
  return `${getEntityImagesPath(entityId)}/order`;
}

export function getMaintenanceImageCleanupTasksPath(limit: number): string {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  return `${apiPaths.maintenanceImageCleanupTasks}?${params.toString()}`;
}
