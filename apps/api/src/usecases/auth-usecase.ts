import { loginCommand } from "../modules/auth/application/login-command";
import { refreshTokenCommand } from "../modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../modules/auth/application/verify-token-query";
import type { AuthTokenPair } from "../modules/auth/infra/auth-gateway-http";
import type { UseCaseResult } from "./result";

export async function loginUseCase(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<UseCaseResult<AuthTokenPair>> {
  return loginCommand(authBaseUrl, username, password);
}

export async function refreshUseCase(
  authBaseUrl: string,
  refreshToken: string
): Promise<UseCaseResult<AuthTokenPair>> {
  return refreshTokenCommand(authBaseUrl, refreshToken);
}

export async function verifyTokenUseCase(authBaseUrl: string, token: string): Promise<boolean> {
  return verifyTokenQuery(authBaseUrl, token);
}
