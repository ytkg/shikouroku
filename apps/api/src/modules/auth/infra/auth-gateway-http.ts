import {
  loginAgainstAuthServer,
  refreshAgainstAuthServer,
  verifyAuthToken,
  type AuthTokenPair
} from "../../../lib/auth-client";

export async function loginWithAuthGateway(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<AuthTokenPair | null> {
  return loginAgainstAuthServer(authBaseUrl, username, password);
}

export async function refreshWithAuthGateway(
  authBaseUrl: string,
  refreshToken: string
): Promise<AuthTokenPair | null> {
  return refreshAgainstAuthServer(authBaseUrl, refreshToken);
}

export async function verifyTokenWithAuthGateway(authBaseUrl: string, token: string): Promise<boolean> {
  return verifyAuthToken(authBaseUrl, token);
}

export type { AuthTokenPair };
