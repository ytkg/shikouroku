import type { AppContext } from "../../app-env";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  makeAccessTokenCookie,
  makeRefreshTokenCookie
} from "../../lib/cookies";
import { errorCodeFromStatus, jsonError } from "../../shared/http/api-response";

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
  response.headers.append("Set-Cookie", makeAccessTokenCookie(accessToken));
  response.headers.append("Set-Cookie", makeRefreshTokenCookie(refreshToken));
}

export function clearAuthCookies(response: Response): void {
  response.headers.append("Set-Cookie", clearAccessTokenCookie());
  response.headers.append("Set-Cookie", clearRefreshTokenCookie());
}

export function useCaseError(c: AppContext, status: number, message: string): Response {
  return jsonError(c, status, errorCodeFromStatus(status), message);
}
