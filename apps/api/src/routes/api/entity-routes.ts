import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import {
  entityBodySchema,
  entityImageOrderBodySchema,
  relatedEntityBodySchema
} from "../../domain/schemas";
import { parseJsonBody } from "../../lib/http";
import { deleteEntityImageCommand } from "../../modules/catalog/image/application/delete-entity-image-command";
import { getEntityImageFileQuery } from "../../modules/catalog/image/application/get-entity-image-file-query";
import { listEntityImagesQuery } from "../../modules/catalog/image/application/list-entity-images-query";
import { reorderEntityImagesCommand } from "../../modules/catalog/image/application/reorder-entity-images-command";
import { uploadEntityImageCommand } from "../../modules/catalog/image/application/upload-entity-image-command";
import { createEntityRelationCommand } from "../../modules/catalog/relation/application/create-entity-relation-command";
import { deleteEntityRelationCommand } from "../../modules/catalog/relation/application/delete-entity-relation-command";
import { listRelatedEntitiesQuery } from "../../modules/catalog/relation/application/list-related-entities-query";
import { jsonError, jsonOk } from "../../shared/http/api-response";
import {
  createEntityUseCase,
  getEntityUseCase,
  listEntitiesUseCase,
  updateEntityUseCase
} from "../../usecases/entities-usecase";
import { useCaseError } from "./shared";

export function createEntityRoutes(): Hono<AppEnv> {
  const entities = new Hono<AppEnv>();

  entities.get("/entities", async (c) => {
    const result = await listEntitiesUseCase(c.env.DB);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { entities: result.data.entities });
  });

  entities.get("/entities/:id", async (c) => {
    const id = c.req.param("id");
    const result = await getEntityUseCase(c.env.DB, id);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { entity: result.data.entity });
  });

  entities.post("/entities", async (c) => {
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

  entities.patch("/entities/:id", async (c) => {
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

  entities.get("/entities/:id/related", async (c) => {
    const id = c.req.param("id");
    const result = await listRelatedEntitiesQuery(c.env.DB, id);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { related: result.data.related });
  });

  entities.post("/entities/:id/related", async (c) => {
    const id = c.req.param("id");
    const parsedBody = await parseJsonBody(c, relatedEntityBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const result = await createEntityRelationCommand(c.env.DB, id, parsedBody.data.relatedEntityId);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {}, 201);
  });

  entities.delete("/entities/:id/related/:relatedEntityId", async (c) => {
    const id = c.req.param("id");
    const relatedEntityId = c.req.param("relatedEntityId");
    const result = await deleteEntityRelationCommand(c.env.DB, id, relatedEntityId);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  entities.get("/entities/:id/images", async (c) => {
    const id = c.req.param("id");
    const result = await listEntityImagesQuery(c.env.DB, id);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { images: result.data.images });
  });

  entities.post("/entities/:id/images", async (c) => {
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

    const result = await uploadEntityImageCommand(c.env.DB, c.env.ENTITY_IMAGES, id, file);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { image: result.data.image }, 201);
  });

  entities.patch("/entities/:id/images/order", async (c) => {
    const id = c.req.param("id");
    const parsedBody = await parseJsonBody(c, entityImageOrderBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const result = await reorderEntityImagesCommand(c.env.DB, id, parsedBody.data.orderedImageIds);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  entities.delete("/entities/:id/images/:imageId", async (c) => {
    const id = c.req.param("id");
    const imageId = c.req.param("imageId");
    const result = await deleteEntityImageCommand(c.env.DB, c.env.ENTITY_IMAGES, id, imageId);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  entities.get("/entities/:id/images/:imageId/file", async (c) => {
    const id = c.req.param("id");
    const imageId = c.req.param("imageId");
    const result = await getEntityImageFileQuery(c.env.DB, c.env.ENTITY_IMAGES, id, imageId);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    const response = new Response(result.data.file.body);
    response.headers.set("Content-Type", result.data.image.mime_type);
    response.headers.set("Content-Length", String(result.data.image.file_size));
    response.headers.set("Cache-Control", "private, max-age=300");
    return response;
  });

  return entities;
}
