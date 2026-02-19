import { encodePathSegment } from "@/shared/lib/url";

export const routePaths = {
  home: "/",
  login: "/login",
  newEntity: "/entities/new",
  notFound: "*",
  entityDetailPattern: "/entities/:entityId",
  entityEditPattern: "/entities/:entityId/edit"
} as const;

export function getEntityDetailPath(entityId: string): string {
  return `/entities/${encodePathSegment(entityId)}`;
}

export function getEntityEditPath(entityId: string): string {
  return `/entities/${encodePathSegment(entityId)}/edit`;
}
