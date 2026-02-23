import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env";
import type { AuthTokenPair } from "../modules/auth/ports/auth-gateway";
import { createHttpAuthGateway } from "../modules/auth/infra/auth-gateway-http";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  makeAccessTokenCookie,
  makeRefreshTokenCookie
} from "../shared/http/auth-cookies";
import { isStaticAssetPath } from "../shared/http/asset-path";
import { refreshTokenCommand } from "../modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../modules/auth/application/verify-token-query";
import { jsonError } from "../shared/http/api-response";
import { toMutableResponse } from "../shared/http/mutable-response";

function setAuthCookies(response: Response, accessToken: string, refreshToken: string): Response {
  const mutableResponse = toMutableResponse(response);
  mutableResponse.headers.append("Set-Cookie", makeAccessTokenCookie(accessToken));
  mutableResponse.headers.append("Set-Cookie", makeRefreshTokenCookie(refreshToken));
  return mutableResponse;
}

function clearAuthCookies(response: Response): Response {
  const mutableResponse = toMutableResponse(response);
  mutableResponse.headers.append("Set-Cookie", clearAccessTokenCookie());
  mutableResponse.headers.append("Set-Cookie", clearRefreshTokenCookie());
  return mutableResponse;
}

export const authSessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const pathname = c.req.path;
  const authGateway = createHttpAuthGateway(c.env.AUTH_BASE_URL);
  const accessToken = getAccessTokenFromCookie(c.req.raw);
  const refreshToken = getRefreshTokenFromCookie(c.req.raw);
  let hasValidToken = accessToken ? await verifyTokenQuery(authGateway, accessToken) : false;
  let refreshedTokens: AuthTokenPair | null = null;

  if (!hasValidToken && refreshToken) {
    const refreshed = await refreshTokenCommand(authGateway, refreshToken);
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
      return clearAuthCookies(response);
    }

    await next();
    if (refreshedTokens) {
      c.res = setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return;
  }

  if (pathname === "/login" && hasValidToken) {
    const response = c.redirect("/", 302);
    if (refreshedTokens) {
      return setAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return response;
  }

  if (!hasValidToken && pathname !== "/login" && !isStaticAssetPath(pathname)) {
    const response = c.redirect("/login", 302);
    return clearAuthCookies(response);
  }

  await next();
  if (refreshedTokens) {
    c.res = setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
  }
};
