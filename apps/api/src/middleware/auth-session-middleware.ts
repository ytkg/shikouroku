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
  makeRefreshTokenCookie,
  shouldUseSecureCookies
} from "../shared/http/auth-cookies";
import { isStaticAssetPath } from "../shared/http/asset-path";
import { refreshTokenCommand } from "../modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../modules/auth/application/verify-token-query";
import { jsonError } from "../shared/http/api-response";
import { toMutableResponse } from "../shared/http/mutable-response";
import {
  buildLoginPathWithReturnTo,
  canAccessApiWithoutAuth,
  isAuthRequiredSpaPath
} from "./auth-session-rules";

function setAuthCookies(response: Response, accessToken: string, refreshToken: string, secure: boolean): Response {
  const mutableResponse = toMutableResponse(response);
  mutableResponse.headers.append("Set-Cookie", makeAccessTokenCookie(accessToken, secure));
  mutableResponse.headers.append("Set-Cookie", makeRefreshTokenCookie(refreshToken, secure));
  return mutableResponse;
}

function clearAuthCookies(response: Response, secure: boolean): Response {
  const mutableResponse = toMutableResponse(response);
  mutableResponse.headers.append("Set-Cookie", clearAccessTokenCookie(secure));
  mutableResponse.headers.append("Set-Cookie", clearRefreshTokenCookie(secure));
  return mutableResponse;
}

export const authSessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const pathname = c.req.path;
  const secure = shouldUseSecureCookies(c.req.raw);
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
    if (!hasValidToken && !canAccessApiWithoutAuth(c.req.method, pathname)) {
      const response = jsonError(c, 401, "UNAUTHORIZED", "unauthorized");
      return clearAuthCookies(response, secure);
    }

    await next();
    if (refreshedTokens) {
      c.res = setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken, secure);
    }
    return;
  }

  if (pathname === "/login" && hasValidToken) {
    const response = c.redirect("/", 302);
    if (refreshedTokens) {
      return setAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken, secure);
    }
    return response;
  }

  if (!hasValidToken && isAuthRequiredSpaPath(pathname) && !isStaticAssetPath(pathname)) {
    const response = c.redirect(buildLoginPathWithReturnTo(c.req.url), 302);
    return clearAuthCookies(response, secure);
  }

  await next();
  if (refreshedTokens) {
    c.res = setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken, secure);
  }
};
