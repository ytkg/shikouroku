const AUTH_BASE_URL = "https://auth.takagi.dev";

export async function loginAgainstAuthServer(username: string, password: string): Promise<string | null> {
  const authRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!authRes.ok) {
    return null;
  }

  const json = (await authRes.json()) as { token?: string };
  if (typeof json.token !== "string" || json.token.length === 0) {
    return null;
  }

  return json.token;
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  const res = await fetch(`${AUTH_BASE_URL}/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}
