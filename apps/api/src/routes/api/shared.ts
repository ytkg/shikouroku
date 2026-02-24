import type { AppContext } from "../../app-env";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  makeAccessTokenCookie,
  makeRefreshTokenCookie
} from "../../shared/http/auth-cookies";
import { errorCodeFromStatus, jsonError } from "../../shared/http/api-response";

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  secure: boolean
): void {
  response.headers.append("Set-Cookie", makeAccessTokenCookie(accessToken, secure));
  response.headers.append("Set-Cookie", makeRefreshTokenCookie(refreshToken, secure));
}

export function clearAuthCookies(response: Response, secure: boolean): void {
  response.headers.append("Set-Cookie", clearAccessTokenCookie(secure));
  response.headers.append("Set-Cookie", clearRefreshTokenCookie(secure));
}

export function useCaseError(c: AppContext, status: number, message: string): Response {
  return jsonError(c, status, errorCodeFromStatus(status), message);
}
