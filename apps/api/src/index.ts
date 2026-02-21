import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "./app-env";
import {
  entityBodySchema,
  loginBodySchema,
  relatedEntityBodySchema,
  tagBodySchema
} from "./domain/schemas";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  makeAccessTokenCookie,
  makeRefreshTokenCookie
} from "./lib/cookies";
import { parseJsonBody } from "./lib/http";
import { isStaticAssetPath } from "./lib/path";
import type { AuthTokenPair } from "./lib/auth-client";
import { loginUseCase, refreshUseCase, verifyTokenUseCase } from "./usecases/auth-usecase";
import {
  createEntityUseCase,
  getEntityUseCase,
  listEntitiesUseCase,
  updateEntityUseCase
} from "./usecases/entities-usecase";
import {
  createEntityRelationUseCase,
  deleteEntityRelationUseCase,
  listRelatedEntitiesUseCase
} from "./usecases/entity-relations-usecase";
import { listKindsUseCase } from "./usecases/kinds-usecase";
import { createTagUseCase, deleteTagUseCase, listTagsUseCase } from "./usecases/tags-usecase";

const app = new Hono<AppEnv>();

function toContentfulStatusCode(status: number): ContentfulStatusCode {
  return status as ContentfulStatusCode;
}

function setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
  response.headers.append("Set-Cookie", makeAccessTokenCookie(accessToken));
  response.headers.append("Set-Cookie", makeRefreshTokenCookie(refreshToken));
}

function clearAuthCookies(response: Response): void {
  response.headers.append("Set-Cookie", clearAccessTokenCookie());
  response.headers.append("Set-Cookie", clearRefreshTokenCookie());
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
  const accessToken = getAccessTokenFromCookie(c.req.raw);
  const refreshToken = getRefreshTokenFromCookie(c.req.raw);
  let hasValidToken = accessToken ? await verifyTokenUseCase(accessToken) : false;
  let refreshedTokens: AuthTokenPair | null = null;

  if (!hasValidToken && refreshToken) {
    const refreshed = await refreshUseCase(refreshToken);
    if (refreshed.ok) {
      hasValidToken = true;
      refreshedTokens = refreshed.data;
    }
  }

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/login") {
      await next();
      return;
    }

    if (!hasValidToken) {
      const response = c.json({ ok: false, message: "unauthorized" }, 401);
      clearAuthCookies(response);
      return response;
    }

    await next();
    if (refreshedTokens) {
      setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return;
  }

  if (pathname === "/login" && hasValidToken) {
    const response = c.redirect("/", 302);
    if (refreshedTokens) {
      setAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return response;
  }

  if (!hasValidToken && pathname !== "/login" && !isStaticAssetPath(pathname)) {
    const response = c.redirect("/login", 302);
    clearAuthCookies(response);
    return response;
  }

  await next();
  if (refreshedTokens) {
    setAuthCookies(c.res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
  }
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

  const response = c.json({ ok: true });
  setAuthCookies(response, result.data.accessToken, result.data.refreshToken);
  return response;
});

app.post("/api/logout", (c) => {
  const response = c.json({ ok: true });
  clearAuthCookies(response);
  return response;
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

app.get("/api/entities/:id/related", async (c) => {
  const id = c.req.param("id");
  const result = await listRelatedEntitiesUseCase(c.env.DB, id);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true, related: result.data.related });
});

app.post("/api/entities/:id/related", async (c) => {
  const id = c.req.param("id");
  const parsedBody = await parseJsonBody(c, relatedEntityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createEntityRelationUseCase(c.env.DB, id, parsedBody.data.relatedEntityId);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true }, 201);
});

app.delete("/api/entities/:id/related/:relatedEntityId", async (c) => {
  const id = c.req.param("id");
  const relatedEntityId = c.req.param("relatedEntityId");
  const result = await deleteEntityRelationUseCase(c.env.DB, id, relatedEntityId);
  if (!result.ok) {
    return c.json({ ok: false, message: result.message }, toContentfulStatusCode(result.status));
  }

  return c.json({ ok: true });
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
