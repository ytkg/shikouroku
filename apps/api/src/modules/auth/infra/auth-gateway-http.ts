import type { AuthGateway, AuthTokenPair } from "../ports/auth-gateway";

type AuthApiTokenResponse = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
};

export const AUTH_GATEWAY_TIMEOUT_MS = 3000;

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

type AuthGatewayOperation = "login" | "refresh" | "verify";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function logAuthGatewayFailure(
  operation: AuthGatewayOperation,
  reason: "timeout" | "network_error" | "upstream_error" | "invalid_response_shape" | "invalid_response_json",
  detail: Record<string, unknown> = {}
): void {
  console.error("[auth-gateway]", {
    operation,
    reason,
    ...detail
  });
}

async function fetchAuthApi(
  authBaseUrl: string,
  path: string,
  operation: AuthGatewayOperation,
  init: RequestInit
): Promise<Response | null> {
  const url = authUrl(authBaseUrl, path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_GATEWAY_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (isAbortError(error)) {
      logAuthGatewayFailure(operation, "timeout", { url, timeoutMs: AUTH_GATEWAY_TIMEOUT_MS });
      return null;
    }

    logAuthGatewayFailure(operation, "network_error", { url, error });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loginWithAuthGateway(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<AuthTokenPair | null> {
  const authRes = await fetchAuthApi(authBaseUrl, "/login", "login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!authRes) {
    return null;
  }

  if (!authRes.ok) {
    if (authRes.status >= 500 || authRes.status === 408 || authRes.status === 429) {
      logAuthGatewayFailure("login", "upstream_error", { status: authRes.status });
    }
    return null;
  }

  let json: AuthApiTokenResponse;
  try {
    json = (await authRes.json()) as AuthApiTokenResponse;
  } catch (error) {
    logAuthGatewayFailure("login", "invalid_response_json", { error });
    return null;
  }

  const tokens = toAuthTokenPair(json);
  if (!tokens) {
    logAuthGatewayFailure("login", "invalid_response_shape");
    return null;
  }

  return tokens;
}

export async function refreshWithAuthGateway(
  authBaseUrl: string,
  refreshToken: string
): Promise<AuthTokenPair | null> {
  const refreshRes = await fetchAuthApi(authBaseUrl, "/refresh", "refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  if (!refreshRes) {
    return null;
  }

  if (!refreshRes.ok) {
    if (refreshRes.status >= 500 || refreshRes.status === 408 || refreshRes.status === 429) {
      logAuthGatewayFailure("refresh", "upstream_error", { status: refreshRes.status });
    }
    return null;
  }

  let json: AuthApiTokenResponse;
  try {
    json = (await refreshRes.json()) as AuthApiTokenResponse;
  } catch (error) {
    logAuthGatewayFailure("refresh", "invalid_response_json", { error });
    return null;
  }

  const tokens = toAuthTokenPair(json);
  if (!tokens) {
    logAuthGatewayFailure("refresh", "invalid_response_shape");
    return null;
  }

  return tokens;
}

export async function verifyTokenWithAuthGateway(authBaseUrl: string, token: string): Promise<boolean> {
  const res = await fetchAuthApi(authBaseUrl, "/verify", "verify", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res) {
    return false;
  }

  if (!res.ok && (res.status >= 500 || res.status === 408 || res.status === 429)) {
    logAuthGatewayFailure("verify", "upstream_error", { status: res.status });
  }

  return res.ok;
}

export function createHttpAuthGateway(authBaseUrl: string): AuthGateway {
  return {
    login: (username, password) => loginWithAuthGateway(authBaseUrl, username, password),
    refresh: (refreshToken) => refreshWithAuthGateway(authBaseUrl, refreshToken),
    verify: (token) => verifyTokenWithAuthGateway(authBaseUrl, token)
  };
}
