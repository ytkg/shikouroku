import { findKindByIdFromD1 } from "../../kind/infra/kind-repository-d1";
import {
  deleteEntityInD1,
  fetchEntityWithTagsFromD1,
  findEntityIdByKindAndNameFromD1,
  insertEntityInD1,
  replaceEntityTagsInD1
} from "../infra/entity-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
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

  const kind = await findKindByIdFromD1(db, body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const duplicated = await findEntityIdByKindAndNameFromD1(db, body.kindId, body.name);
  if (duplicated) {
    return fail(409, "entity already exists");
  }

  const hasValidTags = await validateTagIds(db, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const id = crypto.randomUUID();
  const inserted = await insertEntityInD1(db, {
    id,
    kindId: body.kindId,
    name: body.name,
    description: toDescription(body.description),
    isWishlistFlag: toWishlistFlag(body.isWishlist)
  });

  if (!inserted) {
    return fail(500, "failed to insert entity");
  }

  const tagsInserted = await replaceEntityTagsInD1(db, id, normalizedTagIds);
  if (!tagsInserted) {
    await deleteEntityInD1(db, id);
    return fail(500, "failed to insert entity tags");
  }

  const entity = await fetchEntityWithTagsFromD1(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
