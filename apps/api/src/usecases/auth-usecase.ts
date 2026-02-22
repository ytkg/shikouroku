import {
  loginAgainstAuthServer,
  refreshAgainstAuthServer,
  verifyAuthToken,
  type AuthTokenPair
} from "../lib/auth-client";
import { fail, success, type UseCaseResult } from "./result";

export async function loginUseCase(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await loginAgainstAuthServer(authBaseUrl, username, password);
  if (!tokens) {
    return fail(401, "Invalid credentials");
  }

  return success(tokens);
}

export async function refreshUseCase(
  authBaseUrl: string,
  refreshToken: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await refreshAgainstAuthServer(authBaseUrl, refreshToken);
  if (!tokens) {
    return fail(401, "Invalid refresh token");
  }

  return success(tokens);
}

export async function verifyTokenUseCase(authBaseUrl: string, token: string): Promise<boolean> {
  return verifyAuthToken(authBaseUrl, token);
}
