import { Hono } from "hono";

type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
const AUTH_BASE_URL = "https://auth.takagi.dev";
const TOKEN_COOKIE = "shikouroku_token";

function getTokenFromCookie(request: Request): string | null {
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

function makeTokenCookie(token: string): string {
  return `${TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

function clearTokenCookie(): string {
  return `${TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`${AUTH_BASE_URL}/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok;
}

function isStaticAssetPath(pathname: string): boolean {
  return pathname.includes(".") || pathname.startsWith("/assets/");
}

app.post("/api/login", async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  const username = body.username ?? "";
  const password = body.password ?? "";

  const authRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!authRes.ok) {
    return c.json({ ok: false, error: "Invalid credentials" }, 401);
  }

  const json = (await authRes.json()) as { token: string };
  c.header("Set-Cookie", makeTokenCookie(json.token));
  return c.json({ ok: true });
});

app.get("/api/hello", (c) => {
  return c.json({ ok: true, message: "hello shikouroku" });
});

app.get("/api/kinds", async (c) => {
  const result = await c.env.DB.prepare("SELECT id, label FROM kinds ORDER BY id ASC").all<{
    id: number;
    label: string;
  }>();
  return c.json({ ok: true, kinds: result.results ?? [] });
});

app.get("/api/entities", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities ORDER BY created_at DESC LIMIT 50"
  ).all<{
    id: string;
    kind_id: number;
    name: string;
    description: string | null;
    is_wishlist: number;
    created_at: string;
    updated_at: string;
  }>();
  return c.json({ ok: true, entities: result.results ?? [] });
});

app.get("/api/entities/:id", async (c) => {
  const id = c.req.param("id");
  const entity = await c.env.DB.prepare(
    "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities WHERE id = ? LIMIT 1"
  )
    .bind(id)
    .first<{
      id: string;
      kind_id: number;
      name: string;
      description: string | null;
      is_wishlist: number;
      created_at: string;
      updated_at: string;
    }>();

  if (!entity) {
    return c.json({ ok: false, message: "entity not found" }, 404);
  }

  return c.json({ ok: true, entity });
});

app.post("/api/entities", async (c) => {
  const body = await c.req.json<{
    kindId?: number;
    name?: string;
    description?: string;
    isWishlist?: boolean;
  }>();

  const kindId = Number(body.kindId);
  const name = (body.name ?? "").trim();
  const description = (body.description ?? "").trim();
  const isWishlist = body.isWishlist ? 1 : 0;

  if (!Number.isInteger(kindId) || kindId <= 0) {
    return c.json({ ok: false, message: "kindId is required" }, 400);
  }
  if (!name) {
    return c.json({ ok: false, message: "name is required" }, 400);
  }

  const kind = await c.env.DB.prepare("SELECT id FROM kinds WHERE id = ? LIMIT 1")
    .bind(kindId)
    .first<{ id: number }>();
  if (!kind) {
    return c.json({ ok: false, message: "kind not found" }, 400);
  }

  const id = crypto.randomUUID();
  const inserted = await c.env.DB.prepare(
    "INSERT INTO entities (id, kind_id, name, description, is_wishlist) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, kindId, name, description || null, isWishlist)
    .run();

  if (!inserted.success) {
    return c.json({ ok: false, message: "failed to insert entity" }, 500);
  }

  return c.json(
    {
      ok: true,
      entity: {
        id,
        kind_id: kindId,
        name,
        description: description || null,
        is_wishlist: isWishlist
      }
    },
    201
  );
});

app.get("/api/db/health", async (c) => {
  const row = await c.env.DB.prepare("SELECT datetime('now') AS now").first<{ now: string }>();
  return c.json({ ok: true, now: row?.now ?? null });
});

app.post("/api/logout", (c) => {
  c.header("Set-Cookie", clearTokenCookie());
  return c.json({ ok: true });
});

app.all("/api/*", (c) => {
  return c.json({ ok: false, message: "not found" }, 404);
});

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const token = getTokenFromCookie(request);
    const hasValidToken = token ? await verifyToken(token) : false;

    if (pathname.startsWith("/api/")) {
      if (pathname === "/api/login" || pathname === "/api/db/health") {
        return app.fetch(request, env, ctx);
      }
      if (!hasValidToken) {
        return Response.json({ ok: false, message: "unauthorized" }, { status: 401 });
      }
      return app.fetch(request, env, ctx);
    }

    if (pathname === "/login" && hasValidToken) {
      return Response.redirect(new URL("/", request.url).toString(), 302);
    }

    if (!hasValidToken && pathname !== "/login" && !isStaticAssetPath(pathname)) {
      return Response.redirect(new URL("/login", request.url).toString(), 302);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    const indexRequest = new Request(new URL("/index.html", request.url), request);
    return env.ASSETS.fetch(indexRequest);
  }
};
