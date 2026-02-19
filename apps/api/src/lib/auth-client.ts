const AUTH_BASE_URL = "https://auth.takagi.dev";

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

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

export async function loginAgainstAuthServer(
  username: string,
  password: string
): Promise<AuthTokenPair | null> {
  const authRes = await fetch(`${AUTH_BASE_URL}/login`, {
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

export async function refreshAgainstAuthServer(refreshToken: string): Promise<AuthTokenPair | null> {
  const refreshRes = await fetch(`${AUTH_BASE_URL}/refresh`, {
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

export async function verifyAuthToken(token: string): Promise<boolean> {
  const res = await fetch(`${AUTH_BASE_URL}/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}
