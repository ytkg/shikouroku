import type { AuthGateway, AuthTokenPair } from "../ports/auth-gateway";

type AuthApiTokenResponse = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
};

function toAuthTokenPair(json: AuthApiTokenResponse): AuthTokenPair | null {
  const accessToken =
    typeof json.accessToken === "string" && json.accessToken.length > 0
      ? json.accessToken
      : typeof json.token === "string" && json.token.length > 0
        ? json.token
        : null;

  if (!accessToken) {
    return null;
  }

  if (typeof json.refreshToken !== "string" || json.refreshToken.length === 0) {
    return null;
  }

  return {
    accessToken,
    refreshToken: json.refreshToken
  };
}

function trimTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function authUrl(baseUrl: string, path: string): string {
  return `${trimTrailingSlash(baseUrl)}${path}`;
}

export async function loginWithAuthGateway(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<AuthTokenPair | null> {
  const authRes = await fetch(authUrl(authBaseUrl, "/login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!authRes.ok) {
    return null;
  }

  const json = (await authRes.json()) as AuthApiTokenResponse;
  return toAuthTokenPair(json);
}

export async function refreshWithAuthGateway(
  authBaseUrl: string,
  refreshToken: string
): Promise<AuthTokenPair | null> {
  const refreshRes = await fetch(authUrl(authBaseUrl, "/refresh"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!refreshRes.ok) {
    return null;
  }

  const json = (await refreshRes.json()) as AuthApiTokenResponse;
  return toAuthTokenPair(json);
}

export async function verifyTokenWithAuthGateway(authBaseUrl: string, token: string): Promise<boolean> {
  const res = await fetch(authUrl(authBaseUrl, "/verify"), {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}

export function createHttpAuthGateway(authBaseUrl: string): AuthGateway {
  return {
    login: (username, password) => loginWithAuthGateway(authBaseUrl, username, password),
    refresh: (refreshToken) => refreshWithAuthGateway(authBaseUrl, refreshToken),
    verify: (token) => verifyTokenWithAuthGateway(authBaseUrl, token)
  };
}
