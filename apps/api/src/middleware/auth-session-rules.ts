const ANONYMOUS_READ_API_PATTERNS = [
  /^\/api\/kinds$/,
  /^\/api\/tags$/,
  /^\/api\/entities$/,
  /^\/api\/entities\/locations$/,
  /^\/api\/entities\/[^/]+$/,
  /^\/api\/entities\/[^/]+\/related$/,
  /^\/api\/entities\/[^/]+\/images$/,
  /^\/api\/entities\/[^/]+\/images\/[^/]+\/file$/
];

const NEW_ENTITY_PATH = "/entities/new";
const EDIT_ENTITY_PATH_PATTERN = /^\/entities\/[^/]+\/edit$/;

export function canAccessApiWithoutAuth(method: string, pathname: string): boolean {
  if (method === "POST" && pathname === "/api/login") {
    return true;
  }

  if (method !== "GET") {
    return false;
  }

  return ANONYMOUS_READ_API_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function isAuthRequiredSpaPath(pathname: string): boolean {
  if (pathname === NEW_ENTITY_PATH) {
    return true;
  }
  return EDIT_ENTITY_PATH_PATTERN.test(pathname);
}

export function buildLoginPathWithReturnTo(requestUrl: string): string {
  const url = new URL(requestUrl);
  const returnTo = `${url.pathname}${url.search}`;
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `/login?${params.toString()}`;
}
