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
  return `${apiPaths.entities}/${entityId}`;
}
