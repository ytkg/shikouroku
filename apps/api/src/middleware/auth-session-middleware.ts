import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env";
import type { AuthTokenPair } from "../lib/auth-client";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  makeAccessTokenCookie,
  makeRefreshTokenCookie
} from "../lib/cookies";
import { isStaticAssetPath } from "../lib/path";
import { refreshTokenCommand } from "../modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../modules/auth/application/verify-token-query";
import { jsonError } from "../shared/http/api-response";

function setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
  response.headers.append("Set-Cookie", makeAccessTokenCookie(accessToken));
  response.headers.append("Set-Cookie", makeRefreshTokenCookie(refreshToken));
}

function clearAuthCookies(response: Response): void {
  response.headers.append("Set-Cookie", clearAccessTokenCookie());
  response.headers.append("Set-Cookie", clearRefreshTokenCookie());
}

export const authSessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const pathname = c.req.path;
  const accessToken = getAccessTokenFromCookie(c.req.raw);
  const refreshToken = getRefreshTokenFromCookie(c.req.raw);
  let hasValidToken = accessToken ? await verifyTokenQuery(c.env.AUTH_BASE_URL, accessToken) : false;
  let refreshedTokens: AuthTokenPair | null = null;

  if (!hasValidToken && refreshToken) {
    const refreshed = await refreshTokenCommand(c.env.AUTH_BASE_URL, refreshToken);
    if (refreshed.ok) {
      hasValidToken = true;
      refreshedTokens = refreshed.data;
    }
  }

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/login") {
      await next();
      return;
    }

    if (!hasValidToken) {
      const response = jsonError(c, 401, "UNAUTHORIZED", "unauthorized");
      clearAuthCookies(response);
      return response;
    }

    await next();
    if (refreshedTokens) {
      setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return;
  }

  if (pathname === "/login" && hasValidToken) {
    const response = c.redirect("/", 302);
    if (refreshedTokens) {
      setAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return response;
  }

  if (!hasValidToken && pathname !== "/login" && !isStaticAssetPath(pathname)) {
    const response = c.redirect("/login", 302);
    clearAuthCookies(response);
    return response;
  }

  await next();
  if (refreshedTokens) {
    setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
  }
};
