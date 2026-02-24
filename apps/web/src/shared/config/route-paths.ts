import { encodePathSegment } from "@/shared/lib/url";

export const routePaths = {
  home: "/",
  login: "/login",
  newEntity: "/entities/new",
  notFound: "*",
  entityDetailPattern: "/entities/:entityId",
  entityEditPattern: "/entities/:entityId/edit"
} as const;

export function isSafeReturnToPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  try {
    const url = new URL(value, "https://example.test");
    return url.origin === "https://example.test";
  } catch {
    return false;
  }
}

export function resolveReturnToPath(returnTo: string | null | undefined): string {
  if (!returnTo) {
    return routePaths.home;
  }
  return isSafeReturnToPath(returnTo) ? returnTo : routePaths.home;
}

export function getLoginPath(returnTo: string | null | undefined): string {
  if (!returnTo || !isSafeReturnToPath(returnTo)) {
    return routePaths.login;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("returnTo", returnTo);
  return `${routePaths.login}?${searchParams.toString()}`;
}

export function getEntityDetailPath(entityId: string): string {
  return `/entities/${encodePathSegment(entityId)}`;
}

export function getEntityEditPath(entityId: string): string {
  return `/entities/${encodePathSegment(entityId)}/edit`;
}
