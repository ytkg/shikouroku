const TOKEN_COOKIE = "shikouroku_token";

export function getTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;

  for (const entry of cookie.split(";")) {
    const [rawKey, ...rest] = entry.trim().split("=");
    if (rawKey === TOKEN_COOKIE) {
      return rest.join("=");
    }
  }

  return null;
}

export function makeTokenCookie(token: string): string {
  return `${TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export function clearTokenCookie(): string {
  return `${TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}
