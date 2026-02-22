import type { KindRepository } from "../../kind/ports/kind-repository";
import {
  fetchEntityWithTagsFromD1,
  findEntityIdByKindAndNameFromD1,
  replaceEntityTagsInD1,
  updateEntityInD1
} from "../infra/entity-repository-d1";
import type { TagRepository } from "../../tag/ports/tag-repository";
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

export async function updateEntityCommand(
  db: D1Database,
  kindRepository: Pick<KindRepository, "findKindById">,
  tagRepository: Pick<TagRepository, "countExistingTagsByIds">,
  id: string,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const kind = await kindRepository.findKindById(body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const duplicated = await findEntityIdByKindAndNameFromD1(db, body.kindId, body.name);
  if (duplicated && duplicated.id !== id) {
    return fail(409, "entity already exists");
  }

  const normalizedTagIds = uniqTagIds(body.tagIds);
  const hasValidTags = await validateTagIds(tagRepository, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const updateResult = await updateEntityInD1(db, {
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

  const tagsUpdated = await replaceEntityTagsInD1(db, id, normalizedTagIds);
  if (!tagsUpdated) {
    return fail(500, "failed to update entity tags");
  }

  const entity = await fetchEntityWithTagsFromD1(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
