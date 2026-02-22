import {
  loginWithAuthGateway,
  refreshWithAuthGateway,
  verifyTokenWithAuthGateway,
  type AuthTokenPair
} from "../modules/auth/infra/auth-gateway-http";

export async function loginAgainstAuthServer(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<AuthTokenPair | null> {
  return loginWithAuthGateway(authBaseUrl, username, password);
}

export async function refreshAgainstAuthServer(
  authBaseUrl: string,
  refreshToken: string
): Promise<AuthTokenPair | null> {
  return refreshWithAuthGateway(authBaseUrl, refreshToken);
}

export async function verifyAuthToken(authBaseUrl: string, token: string): Promise<boolean> {
  return verifyTokenWithAuthGateway(authBaseUrl, token);
}

export type { AuthTokenPair };
