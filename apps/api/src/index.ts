import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "./app-env";
import { entityBodySchema, loginBodySchema, tagBodySchema } from "./domain/schemas";
import { clearTokenCookie, getTokenFromCookie, makeTokenCookie } from "./lib/cookies";
import { parseJsonBody } from "./lib/http";
import { isStaticAssetPath } from "./lib/path";
import { loginUseCase, verifyTokenUseCase } from "./usecases/auth-usecase";
import {
  createEntityUseCase,
  getEntityUseCase,
  listEntitiesUseCase,
  updateEntityUseCase
} from "./usecases/entities-usecase";
import { listKindsUseCase } from "./usecases/kinds-usecase";
import { createTagUseCase, deleteTagUseCase, listTagsUseCase } from "./usecases/tags-usecase";

const app = new Hono<AppEnv>();

function toContentfulStatusCode(status: number): ContentfulStatusCode {
  return status as ContentfulStatusCode;
}

async function resolveSpaAsset(request: Request, assets: Fetcher): Promise<Response> {
  const assetResponse = await assets.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  const indexRequest = new Request(new URL("/index.html", request.url), request);
  return assets.fetch(indexRequest);
}

app.use("*", async (c, next) => {
  const pathname = c.req.path;
  const token = getTokenFromCookie(c.req.raw);
  const hasValidToken = token ? await verifyTokenUseCase(token) : false;

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/login") {
      await next();
      return;
    }

    if (!hasValidToken) {
      return c.json({ ok: false, message: "unauthorized" }, 401);
    }

    await next();
    return;
  }

  if (pathname === "/login" && hasValidToken) {
    return c.redirect("/", 302);
  }

  if (!hasValidToken && pathname !== "/login" && !isStaticAssetPath(pathname)) {
    return c.redirect("/login", 302);
  }

  await next();
});

app.post("/api/login", async (c) => {
  const parsedBody = await parseJsonBody(c, loginBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await loginUseCase(parsedBody.data.username, parsedBody.data.password);
  if (!result.ok) {
    return c.json({ ok: false, error: result.message }, toContentfulStatusCode(result.status));
  }

  c.header("Set-Cookie", makeTokenCookie(result.data.token));
  return c.json({ ok: true });
});

app.post("/api/logout", (c) => {
  c.header("Set-Cookie", clearTokenCookie());
  return c.json({ ok: true });
});

app.get("/api/kinds", async (c) => {
  const result = await listKindsUseCase(c.env.DB);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, kinds: result.data.kinds });
});

app.get("/api/tags", async (c) => {
  const result = await listTagsUseCase(c.env.DB);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, tags: result.data.tags });
});

app.post("/api/tags", async (c) => {
  const parsedBody = await parseJsonBody(c, tagBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createTagUseCase(c.env.DB, parsedBody.data.name);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, tag: result.data.tag }, 201);
});

app.delete("/api/tags/:id", async (c) => {
  const idRaw = c.req.param("id");
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ ok: false, message: "tag id is invalid" }, 400);
  }

  const result = await deleteTagUseCase(c.env.DB, id);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true });
});

app.get("/api/entities", async (c) => {
  const result = await listEntitiesUseCase(c.env.DB);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, entities: result.data.entities });
});

app.get("/api/entities/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getEntityUseCase(c.env.DB, id);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, entity: result.data.entity });
});

app.post("/api/entities", async (c) => {
  const parsedBody = await parseJsonBody(c, entityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createEntityUseCase(c.env.DB, parsedBody.data);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, entity: result.data.entity }, 201);
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

  const result = await updateEntityUseCase(c.env.DB, id, parsedBody.data);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, entity: result.data.entity });
});

app.all("/api/*", (c) => {
  return c.json({ ok: false, message: "not found" }, 404);
});

app.all("*", async (c) => {
  return resolveSpaAsset(c.req.raw, c.env.ASSETS);
});

export default app;
