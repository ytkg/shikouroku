const ACCESS_TOKEN_COOKIE = "shikouroku_token";
const REFRESH_TOKEN_COOKIE = "shikouroku_refresh_token";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function cookieSecureAttr(secure: boolean): string {
  return secure ? "; Secure" : "";
}

export function shouldUseSecureCookies(request: Request): boolean {
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return true;
  }
}

function getCookieValue(request: Request, key: string): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) {
    return null;
  }

  for (const entry of cookie.split(";")) {
    const [rawKey, ...rest] = entry.trim().split("=");
    if (rawKey === key) {
      return rest.join("=");
    }
  }

  return null;
}

export function getAccessTokenFromCookie(request: Request): string | null {
  return getCookieValue(request, ACCESS_TOKEN_COOKIE);
}

export function getRefreshTokenFromCookie(request: Request): string | null {
  return getCookieValue(request, REFRESH_TOKEN_COOKIE);
}

export function makeAccessTokenCookie(token: string, secure = true): string {
  return `${ACCESS_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${cookieSecureAttr(secure)}; Max-Age=${ACCESS_TOKEN_MAX_AGE_SECONDS}`;
}

export function makeRefreshTokenCookie(token: string, secure = true): string {
  return `${REFRESH_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${cookieSecureAttr(secure)}; Max-Age=${REFRESH_TOKEN_MAX_AGE_SECONDS}`;
}

export function clearAccessTokenCookie(secure = true): string {
  return `${ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${cookieSecureAttr(secure)}; Max-Age=0`;
}

export function clearRefreshTokenCookie(secure = true): string {
  return `${REFRESH_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${cookieSecureAttr(secure)}; Max-Age=0`;
}
