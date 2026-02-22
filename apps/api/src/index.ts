import { Hono } from "hono";
import type { AppContext, AppEnv } from "./app-env";
import {
  entityImageOrderBodySchema,
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
  deleteEntityImageUseCase,
  getEntityImageFileUseCase,
  listEntityImagesUseCase,
  reorderEntityImagesUseCase,
  uploadEntityImageUseCase
} from "./usecases/entity-images-usecase";
import {
  createEntityRelationUseCase,
  deleteEntityRelationUseCase,
  listRelatedEntitiesUseCase
} from "./usecases/entity-relations-usecase";
import { listKindsUseCase } from "./usecases/kinds-usecase";
import { createTagUseCase, deleteTagUseCase, listTagsUseCase } from "./usecases/tags-usecase";
import { errorCodeFromStatus, jsonError, jsonOk } from "./shared/http/api-response";
import { requestIdMiddleware } from "./shared/http/request-id";

const app = new Hono<AppEnv>();

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

function useCaseError(c: AppContext, status: number, message: string): Response {
  return jsonError(c, status, errorCodeFromStatus(status), message);
}

app.use("*", requestIdMiddleware);

app.use("*", async (c, next) => {
  const pathname = c.req.path;
  const accessToken = getAccessTokenFromCookie(c.req.raw);
  const refreshToken = getRefreshTokenFromCookie(c.req.raw);
  let hasValidToken = accessToken ? await verifyTokenUseCase(c.env.AUTH_BASE_URL, accessToken) : false;
  let refreshedTokens: AuthTokenPair | null = null;

  if (!hasValidToken && refreshToken) {
    const refreshed = await refreshUseCase(c.env.AUTH_BASE_URL, refreshToken);
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
      const response = jsonError(c, 401, "UNAUTHORIZED", "unauthorized");
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

  const result = await loginUseCase(c.env.AUTH_BASE_URL, parsedBody.data.username, parsedBody.data.password);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  const response = jsonOk(c, {});
  setAuthCookies(response, result.data.accessToken, result.data.refreshToken);
  return response;
});

app.post("/api/logout", (c) => {
  const response = jsonOk(c, {});
  clearAuthCookies(response);
  return response;
});

app.get("/api/kinds", async (c) => {
  const result = await listKindsUseCase(c.env.DB);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { kinds: result.data.kinds });
});

app.get("/api/tags", async (c) => {
  const result = await listTagsUseCase(c.env.DB);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { tags: result.data.tags });
});

app.post("/api/tags", async (c) => {
  const parsedBody = await parseJsonBody(c, tagBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createTagUseCase(c.env.DB, parsedBody.data.name);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { tag: result.data.tag }, 201);
});

app.delete("/api/tags/:id", async (c) => {
  const idRaw = c.req.param("id");
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError(c, 400, "INVALID_TAG_ID", "tag id is invalid");
  }

  const result = await deleteTagUseCase(c.env.DB, id);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, {});
});

app.get("/api/entities", async (c) => {
  const result = await listEntitiesUseCase(c.env.DB);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { entities: result.data.entities });
});

app.get("/api/entities/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getEntityUseCase(c.env.DB, id);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { entity: result.data.entity });
});

app.get("/api/entities/:id/related", async (c) => {
  const id = c.req.param("id");
  const result = await listRelatedEntitiesUseCase(c.env.DB, id);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { related: result.data.related });
});

app.post("/api/entities/:id/related", async (c) => {
  const id = c.req.param("id");
  const parsedBody = await parseJsonBody(c, relatedEntityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createEntityRelationUseCase(c.env.DB, id, parsedBody.data.relatedEntityId);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, {}, 201);
});

app.delete("/api/entities/:id/related/:relatedEntityId", async (c) => {
  const id = c.req.param("id");
  const relatedEntityId = c.req.param("relatedEntityId");
  const result = await deleteEntityRelationUseCase(c.env.DB, id, relatedEntityId);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, {});
});

app.get("/api/entities/:id/images", async (c) => {
  const id = c.req.param("id");
  const result = await listEntityImagesUseCase(c.env.DB, id);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { images: result.data.images });
});

app.post("/api/entities/:id/images", async (c) => {
  const id = c.req.param("id");

  let formData: FormData;
  try {
    formData = await c.req.raw.formData();
  } catch {
    return jsonError(c, 400, "INVALID_MULTIPART_BODY", "invalid multipart body");
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return jsonError(c, 400, "IMAGE_FILE_REQUIRED", "file is required");
  }

  const result = await uploadEntityImageUseCase(c.env.DB, c.env.ENTITY_IMAGES, id, file);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { image: result.data.image }, 201);
});

app.patch("/api/entities/:id/images/order", async (c) => {
  const id = c.req.param("id");
  const parsedBody = await parseJsonBody(c, entityImageOrderBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await reorderEntityImagesUseCase(c.env.DB, id, parsedBody.data.orderedImageIds);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, {});
});

app.delete("/api/entities/:id/images/:imageId", async (c) => {
  const id = c.req.param("id");
  const imageId = c.req.param("imageId");
  const result = await deleteEntityImageUseCase(c.env.DB, c.env.ENTITY_IMAGES, id, imageId);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, {});
});

app.get("/api/entities/:id/images/:imageId/file", async (c) => {
  const id = c.req.param("id");
  const imageId = c.req.param("imageId");
  const result = await getEntityImageFileUseCase(c.env.DB, c.env.ENTITY_IMAGES, id, imageId);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  const response = new Response(result.data.file.body);
  response.headers.set("Content-Type", result.data.image.mime_type);
  response.headers.set("Content-Length", String(result.data.image.file_size));
  response.headers.set("Cache-Control", "private, max-age=300");
  return response;
});

app.post("/api/entities", async (c) => {
  const parsedBody = await parseJsonBody(c, entityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createEntityUseCase(c.env.DB, parsedBody.data);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { entity: result.data.entity }, 201);
});

app.patch("/api/entities/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) {
    return jsonError(c, 400, "ENTITY_ID_REQUIRED", "id is required");
  }

  const parsedBody = await parseJsonBody(c, entityBodySchema);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await updateEntityUseCase(c.env.DB, id, parsedBody.data);
  if (!result.ok) {
    return useCaseError(c, result.status, result.message);
  }

  return jsonOk(c, { entity: result.data.entity });
});

app.all("/api/*", (c) => {
  return jsonError(c, 404, "NOT_FOUND", "not found");
});

app.all("*", async (c) => {
  return resolveSpaAsset(c.req.raw, c.env.ASSETS);
});

export default app;
