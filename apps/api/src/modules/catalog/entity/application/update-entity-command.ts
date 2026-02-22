import { findKindById } from "../../../../repositories/kind-repository";
import {
  fetchEntityWithTags,
  findEntityIdByKindAndName,
  replaceEntityTags,
  updateEntity
} from "../../../../repositories/entity-repository";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import {
  toDescription,
  toEntityResponse,
  toWishlistFlag,
  uniqTagIds,
  validateTagIds,
  type EntityResponseDto,
  type UpsertEntityCommand
} from "./entity-shared";

export async function updateEntityCommand(
  db: D1Database,
  id: string,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const kind = await findKindById(db, body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const duplicated = await findEntityIdByKindAndName(db, body.kindId, body.name);
  if (duplicated && duplicated.id !== id) {
    return fail(409, "entity already exists");
  }

  const normalizedTagIds = uniqTagIds(body.tagIds);
  const hasValidTags = await validateTagIds(db, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const updateResult = await updateEntity(db, {
    id,
    kindId: body.kindId,
    name: body.name,
    description: toDescription(body.description),
    isWishlistFlag: toWishlistFlag(body.isWishlist)
  });

  if (updateResult === "not_found") {
    return fail(404, "entity not found");
  }
  if (updateResult === "error") {
    return fail(500, "failed to update entity");
  }

  const tagsUpdated = await replaceEntityTags(db, id, normalizedTagIds);
  if (!tagsUpdated) {
    return fail(500, "failed to update entity tags");
  }

  const entity = await fetchEntityWithTags(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
