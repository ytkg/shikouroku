import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { tagBodySchema } from "../../shared/validation/request-schemas";
import { parseJsonBody } from "../../shared/http/parse-json-body";
import { createTagCommand } from "../../modules/catalog/tag/application/create-tag-command";
import { deleteTagCommand } from "../../modules/catalog/tag/application/delete-tag-command";
import { listTagsQuery } from "../../modules/catalog/tag/application/list-tags-query";
import { createD1TagRepository } from "../../modules/catalog/tag/infra/tag-repository-d1";
import { jsonError, jsonOk } from "../../shared/http/api-response";
import { useCaseError } from "./shared";

export function createTagRoutes(): Hono<AppEnv> {
  const tags = new Hono<AppEnv>();

  tags.get("/tags", async (c) => {
    const tagRepository = createD1TagRepository(c.env.DB);
    const result = await listTagsQuery(tagRepository);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { tags: result.data.tags });
  });

  tags.post("/tags", async (c) => {
    const parsedBody = await parseJsonBody(c, tagBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const tagRepository = createD1TagRepository(c.env.DB);
    const result = await createTagCommand(tagRepository, parsedBody.data.name);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { tag: result.data.tag }, 201);
  });

  tags.delete("/tags/:id", async (c) => {
    const idRaw = c.req.param("id");
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) {
      return jsonError(c, 400, "INVALID_TAG_ID", "tag id is invalid");
    }

    const tagRepository = createD1TagRepository(c.env.DB);
    const result = await deleteTagCommand(tagRepository, id);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, {});
  });

  return tags;
}
