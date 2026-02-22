import { findKindById } from "../../../../repositories/kind-repository";
import {
  deleteEntity,
  fetchEntityWithTags,
  findEntityIdByKindAndName,
  insertEntity,
  replaceEntityTags
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

export async function createEntityCommand(
  db: D1Database,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const normalizedTagIds = uniqTagIds(body.tagIds);

  const kind = await findKindById(db, body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const duplicated = await findEntityIdByKindAndName(db, body.kindId, body.name);
  if (duplicated) {
    return fail(409, "entity already exists");
  }

  const hasValidTags = await validateTagIds(db, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const id = crypto.randomUUID();
  const inserted = await insertEntity(db, {
    id,
    kindId: body.kindId,
    name: body.name,
    description: toDescription(body.description),
    isWishlistFlag: toWishlistFlag(body.isWishlist)
  });

  if (!inserted) {
    return fail(500, "failed to insert entity");
  }

  const tagsInserted = await replaceEntityTags(db, id, normalizedTagIds);
  if (!tagsInserted) {
    await deleteEntity(db, id);
    return fail(500, "failed to insert entity tags");
  }

  const entity = await fetchEntityWithTags(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
