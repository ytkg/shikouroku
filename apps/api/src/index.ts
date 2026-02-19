import { Context, Hono } from "hono";
import { z } from "zod";

type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
const AUTH_BASE_URL = "https://auth.takagi.dev";
const TOKEN_COOKIE = "shikouroku_token";
type AppContext = Context<{ Bindings: Bindings }>;
type TagRow = {
  id: number;
  name: string;
};
type EntityRow = {
  id: string;
  kind_id: number;
  name: string;
  description: string | null;
  is_wishlist: number;
  created_at: string;
  updated_at: string;
};
type EntityTagRow = {
  entity_id: string;
  id: number;
  name: string;
};
type EntityWithTagsRow = EntityRow & { tags: TagRow[] };

const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const tagBodySchema = z.object({
  name: z.string().trim().min(1)
});

const entityBodySchema = z.object({
  kindId: z.number().int().positive(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  isWishlist: z.boolean().optional().default(false),
  tagIds: z.array(z.number().int().positive()).optional().default([])
});

function validationMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];
  if (field === "kindId") return "kindId is required";
  if (field === "name") return "name is required";
  if (field === "tagIds") return "tagIds is invalid";
  if (field === "username") return "username is required";
  if (field === "password") return "password is required";
  return "invalid request body";
}

async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  c: AppContext,
  schema: TSchema
): Promise<{ ok: true; data: z.infer<TSchema> } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return {
      ok: false,
      response: c.json({ ok: false, message: "invalid json body" }, 400)
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json({ ok: false, message: validationMessage(parsed.error) }, 400)
    };
  }

  return { ok: true, data: parsed.data };
}

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

function uniqTagIds(tagIds: number[]): number[] {
  return [...new Set(tagIds)];
}

async function validateTagIds(db: D1Database, tagIds: number[]): Promise<boolean> {
  if (tagIds.length === 0) {
    return true;
  }

  const placeholders = tagIds.map(() => "?").join(", ");
  const result = await db
    .prepare(`SELECT id FROM tags WHERE id IN (${placeholders})`)
    .bind(...tagIds)
    .all<{ id: number }>();
  return (result.results ?? []).length === tagIds.length;
}

async function replaceEntityTags(
  db: D1Database,
  entityId: string,
  tagIds: number[]
): Promise<boolean> {
  const deleted = await db.prepare("DELETE FROM entity_tags WHERE entity_id = ?").bind(entityId).run();
  if (!deleted.success) {
    return false;
  }

  for (const tagId of tagIds) {
    const inserted = await db
      .prepare("INSERT INTO entity_tags (entity_id, tag_id) VALUES (?, ?)")
      .bind(entityId, tagId)
      .run();
    if (!inserted.success) {
      return false;
    }
  }

  return true;
}

async function fetchTagsByEntityIds(
  db: D1Database,
  entityIds: string[]
): Promise<Map<string, TagRow[]>> {
  const tagsByEntity = new Map<string, TagRow[]>();
  if (entityIds.length === 0) {
    return tagsByEntity;
  }

  const placeholders = entityIds.map(() => "?").join(", ");
  const tagsResult = await db
    .prepare(
      `SELECT et.entity_id, t.id, t.name
       FROM entity_tags et
       INNER JOIN tags t ON t.id = et.tag_id
       WHERE et.entity_id IN (${placeholders})
       ORDER BY t.name ASC, t.id ASC`
    )
    .bind(...entityIds)
    .all<EntityTagRow>();

  for (const row of tagsResult.results ?? []) {
    const existing = tagsByEntity.get(row.entity_id);
    if (existing) {
      existing.push({ id: row.id, name: row.name });
      continue;
    }
    tagsByEntity.set(row.entity_id, [{ id: row.id, name: row.name }]);
  }

  return tagsByEntity;
}

async function fetchEntityWithTags(db: D1Database, entityId: string): Promise<EntityWithTagsRow | null> {
  const entity = await db
    .prepare(
      "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities WHERE id = ? LIMIT 1"
    )
    .bind(entityId)
    .first<EntityRow>();

  if (!entity) {
    return null;
  }

  const tagsByEntity = await fetchTagsByEntityIds(db, [entityId]);
  return { ...entity, tags: tagsByEntity.get(entityId) ?? [] };
}

app.post("/api/login", async (c) => {
  const parsedBody = await parseJsonBody(c, loginBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const { username, password } = parsedBody.data;

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

app.get("/api/kinds", async (c) => {
  const result = await c.env.DB.prepare("SELECT id, label FROM kinds ORDER BY id ASC").all<{
    id: number;
    label: string;
  }>();
  return c.json({ ok: true, kinds: result.results ?? [] });
});

app.get("/api/tags", async (c) => {
  const result = await c.env.DB.prepare("SELECT id, name FROM tags ORDER BY name ASC, id ASC").all<TagRow>();
  return c.json({ ok: true, tags: result.results ?? [] });
});

app.post("/api/tags", async (c) => {
  const parsedBody = await parseJsonBody(c, tagBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const { name } = parsedBody.data;

  const existing = await c.env.DB.prepare("SELECT id FROM tags WHERE name = ? LIMIT 1").bind(name).first<{
    id: number;
  }>();
  if (existing) {
    return c.json({ ok: false, message: "tag already exists" }, 409);
  }

  const inserted = await c.env.DB.prepare("INSERT INTO tags (name) VALUES (?)").bind(name).run();
  if (!inserted.success) {
    return c.json({ ok: false, message: "failed to insert tag" }, 500);
  }

  const tag = await c.env.DB.prepare("SELECT id, name FROM tags WHERE name = ? LIMIT 1").bind(name).first<TagRow>();
  if (!tag) {
    return c.json({ ok: false, message: "failed to load tag" }, 500);
  }

  return c.json({ ok: true, tag }, 201);
});

app.get("/api/entities", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities ORDER BY created_at DESC LIMIT 50"
  ).all<EntityRow>();

  const entities = result.results ?? [];
  const tagsByEntity = await fetchTagsByEntityIds(
    c.env.DB,
    entities.map((entity) => entity.id)
  );
  const entitiesWithTags = entities.map((entity) => ({
    ...entity,
    tags: tagsByEntity.get(entity.id) ?? []
  }));

  return c.json({ ok: true, entities: entitiesWithTags });
});

app.get("/api/entities/:id", async (c) => {
  const id = c.req.param("id");
  const entity = await fetchEntityWithTags(c.env.DB, id);

  if (!entity) {
    return c.json({ ok: false, message: "entity not found" }, 404);
  }

  return c.json({ ok: true, entity });
});

app.patch("/api/entities/:id", async (c) => {
  const id = c.req.param("id");

  if (!id) {
    return c.json({ ok: false, message: "id is required" }, 400);
  }

  const parsedBody = await parseJsonBody(c, entityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const { kindId, name, description, isWishlist, tagIds } = parsedBody.data;
  const normalizedTagIds = uniqTagIds(tagIds);
  const isWishlistFlag = isWishlist ? 1 : 0;

  const kind = await c.env.DB.prepare("SELECT id FROM kinds WHERE id = ? LIMIT 1")
    .bind(kindId)
    .first<{ id: number }>();
  if (!kind) {
    return c.json({ ok: false, message: "kind not found" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM entities WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string }>();
  if (!existing) {
    return c.json({ ok: false, message: "entity not found" }, 404);
  }

  const hasValidTags = await validateTagIds(c.env.DB, normalizedTagIds);
  if (!hasValidTags) {
    return c.json({ ok: false, message: "tag not found" }, 400);
  }

  const updated = await c.env.DB.prepare(
    "UPDATE entities SET kind_id = ?, name = ?, description = ?, is_wishlist = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(kindId, name, description || null, isWishlistFlag, id)
    .run();

  if (!updated.success) {
    return c.json({ ok: false, message: "failed to update entity" }, 500);
  }

  const tagUpdated = await replaceEntityTags(c.env.DB, id, normalizedTagIds);
  if (!tagUpdated) {
    return c.json({ ok: false, message: "failed to update entity tags" }, 500);
  }

  const entity = await fetchEntityWithTags(c.env.DB, id);
  if (!entity) {
    return c.json({ ok: false, message: "entity not found" }, 404);
  }

  return c.json({ ok: true, entity });
});

app.post("/api/entities", async (c) => {
  const parsedBody = await parseJsonBody(c, entityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const { kindId, name, description, isWishlist, tagIds } = parsedBody.data;
  const normalizedTagIds = uniqTagIds(tagIds);
  const isWishlistFlag = isWishlist ? 1 : 0;

  const kind = await c.env.DB.prepare("SELECT id FROM kinds WHERE id = ? LIMIT 1")
    .bind(kindId)
    .first<{ id: number }>();
  if (!kind) {
    return c.json({ ok: false, message: "kind not found" }, 400);
  }

  const hasValidTags = await validateTagIds(c.env.DB, normalizedTagIds);
  if (!hasValidTags) {
    return c.json({ ok: false, message: "tag not found" }, 400);
  }

  const id = crypto.randomUUID();
  const inserted = await c.env.DB.prepare(
    "INSERT INTO entities (id, kind_id, name, description, is_wishlist) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, kindId, name, description || null, isWishlistFlag)
    .run();

  if (!inserted.success) {
    return c.json({ ok: false, message: "failed to insert entity" }, 500);
  }

  const tagInserted = await replaceEntityTags(c.env.DB, id, normalizedTagIds);
  if (!tagInserted) {
    await c.env.DB.prepare("DELETE FROM entities WHERE id = ?").bind(id).run();
    return c.json({ ok: false, message: "failed to insert entity tags" }, 500);
  }

  const entity = await fetchEntityWithTags(c.env.DB, id);
  if (!entity) {
    return c.json({ ok: false, message: "entity not found" }, 404);
  }

  return c.json({ ok: true, entity }, 201);
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
      if (pathname === "/api/login") {
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
