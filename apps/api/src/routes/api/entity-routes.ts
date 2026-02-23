import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import {
  entityBodySchema,
  entityImageOrderBodySchema,
  relatedEntityBodySchema
} from "../../shared/validation/request-schemas";
import { parseJsonBody } from "../../shared/http/parse-json-body";
import { createEntityCommand } from "../../modules/catalog/entity/application/create-entity-command";
import { getEntityQuery } from "../../modules/catalog/entity/application/get-entity-query";
import {
  listEntitiesQuery
} from "../../modules/catalog/entity/application/list-entities-query";
import { resolveEntityListQueryParams } from "../../modules/catalog/entity/application/entity-list-query-params";
import { updateEntityCommand } from "../../modules/catalog/entity/application/update-entity-command";
import { createD1EntityReadRepository } from "../../modules/catalog/entity/infra/entity-repository-d1";
import { createD1KindRepository } from "../../modules/catalog/kind/infra/kind-repository-d1";
import { createD1TagRepository } from "../../modules/catalog/tag/infra/tag-repository-d1";
import { deleteEntityImageCommand } from "../../modules/catalog/image/application/delete-entity-image-command";
import { getEntityImageFileQuery } from "../../modules/catalog/image/application/get-entity-image-file-query";
import { listEntityImagesQuery } from "../../modules/catalog/image/application/list-entity-images-query";
import { reorderEntityImagesCommand } from "../../modules/catalog/image/application/reorder-entity-images-command";
import { uploadEntityImageCommand } from "../../modules/catalog/image/application/upload-entity-image-command";
import { createEntityRelationCommand } from "../../modules/catalog/relation/application/create-entity-relation-command";
import { deleteEntityRelationCommand } from "../../modules/catalog/relation/application/delete-entity-relation-command";
import { listRelatedEntitiesQuery } from "../../modules/catalog/relation/application/list-related-entities-query";
import { createD1RelationRepository } from "../../modules/catalog/relation/infra/relation-repository-d1";
import { createD1ImageCleanupTaskRepository } from "../../modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";
import { jsonError, jsonOk } from "../../shared/http/api-response";
import { useCaseError } from "./shared";

export function createEntityRoutes(): Hono<AppEnv> {
  const entities = new Hono<AppEnv>();

  entities.get("/entities", async (c) => {
    const resolvedQuery = resolveEntityListQueryParams({
      limit: c.req.query("limit"),
      cursor: c.req.query("cursor"),
      match: c.req.query("match"),
      fields: c.req.query("fields"),
      kindId: c.req.query("kindId"),
      wishlist: c.req.query("wishlist"),
      q: c.req.query("q")
    });
    if (!resolvedQuery.ok) {
      return jsonError(c, 400, resolvedQuery.error.code, resolvedQuery.error.message);
    }

    const result = await listEntitiesQuery(c.env.DB, resolvedQuery.data);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { entities: result.data.entities, page: result.data.page });
  });

  entities.get("/entities/:id", async (c) => {
    const id = c.req.param("id");
    const result = await getEntityQuery(c.env.DB, id);
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

    const kindRepository = createD1KindRepository(c.env.DB);
    const tagRepository = createD1TagRepository(c.env.DB);
    const result = await createEntityCommand(c.env.DB, kindRepository, tagRepository, parsedBody.data);
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

    const kindRepository = createD1KindRepository(c.env.DB);
    const tagRepository = createD1TagRepository(c.env.DB);
    const result = await updateEntityCommand(c.env.DB, kindRepository, tagRepository, id, parsedBody.data);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { entity: result.data.entity });
  });

  entities.get("/entities/:id/related", async (c) => {
    const id = c.req.param("id");
    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const relationRepository = createD1RelationRepository(c.env.DB);
    const result = await listRelatedEntitiesQuery(entityReadRepository, relationRepository, id);
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

    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const relationRepository = createD1RelationRepository(c.env.DB);
    const result = await createEntityRelationCommand(
      entityReadRepository,
      relationRepository,
      id,
      parsedBody.data.relatedEntityId
    );
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {}, 201);
  });

  entities.delete("/entities/:id/related/:relatedEntityId", async (c) => {
    const id = c.req.param("id");
    const relatedEntityId = c.req.param("relatedEntityId");
    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const relationRepository = createD1RelationRepository(c.env.DB);
    const result = await deleteEntityRelationCommand(entityReadRepository, relationRepository, id, relatedEntityId);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  entities.get("/entities/:id/images", async (c) => {
    const id = c.req.param("id");
    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const result = await listEntityImagesQuery(c.env.DB, entityReadRepository, id);
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

    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const imageCleanupTaskRepository = createD1ImageCleanupTaskRepository(c.env.DB);
    const result = await uploadEntityImageCommand(
      c.env.DB,
      c.env.ENTITY_IMAGES,
      entityReadRepository,
      imageCleanupTaskRepository,
      id,
      file
    );
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

    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const result = await reorderEntityImagesCommand(c.env.DB, entityReadRepository, id, parsedBody.data.orderedImageIds);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  entities.delete("/entities/:id/images/:imageId", async (c) => {
    const id = c.req.param("id");
    const imageId = c.req.param("imageId");
    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const imageCleanupTaskRepository = createD1ImageCleanupTaskRepository(c.env.DB);
    const result = await deleteEntityImageCommand(
      c.env.DB,
      c.env.ENTITY_IMAGES,
      entityReadRepository,
      imageCleanupTaskRepository,
      id,
      imageId
    );
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  entities.get("/entities/:id/images/:imageId/file", async (c) => {
    const id = c.req.param("id");
    const imageId = c.req.param("imageId");
    const entityReadRepository = createD1EntityReadRepository(c.env.DB);
    const result = await getEntityImageFileQuery(c.env.DB, c.env.ENTITY_IMAGES, entityReadRepository, id, imageId);
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
