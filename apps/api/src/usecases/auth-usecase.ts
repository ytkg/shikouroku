import {
  loginAgainstAuthServer,
  refreshAgainstAuthServer,
  verifyAuthToken,
  type AuthTokenPair
} from "../lib/auth-client";
import { fail, success, type UseCaseResult } from "./result";

export async function loginUseCase(
  username: string,
  password: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await loginAgainstAuthServer(username, password);
  if (!tokens) {
    return fail(401, "Invalid credentials");
  }

  return success(tokens);
}

export async function refreshUseCase(refreshToken: string): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await refreshAgainstAuthServer(refreshToken);
  if (!tokens) {
    return fail(401, "Invalid refresh token");
  }

  return success(tokens);
}

export async function verifyTokenUseCase(token: string): Promise<boolean> {
  return verifyAuthToken(token);
}
