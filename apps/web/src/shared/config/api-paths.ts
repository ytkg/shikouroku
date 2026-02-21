import { encodePathSegment } from "@/shared/lib/url";

export const apiPaths = {
  login: "/api/login",
  logout: "/api/logout",
  kinds: "/api/kinds",
  tags: "/api/tags",
  entities: "/api/entities"
} as const;

export function getTagPath(tagId: number): string {
  return `${apiPaths.tags}/${tagId}`;
}

export function getEntityPath(entityId: string): string {
  return `${apiPaths.entities}/${encodePathSegment(entityId)}`;
}

export function getEntityRelatedPath(entityId: string): string {
  return `${getEntityPath(entityId)}/related`;
}

export function getEntityRelationPath(entityId: string, relatedEntityId: string): string {
  return `${getEntityRelatedPath(entityId)}/${encodePathSegment(relatedEntityId)}`;
}
