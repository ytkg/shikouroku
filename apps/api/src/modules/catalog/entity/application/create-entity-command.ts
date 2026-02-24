import type { KindRepository } from "../../kind/ports/kind-repository";
import {
  fetchEntityWithTagsFromD1,
  findEntityIdByKindAndNameFromD1,
  insertEntityWithTagsInD1
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

const LOCATION_KIND_LABEL = "場所";

export async function createEntityCommand(
  db: D1Database,
  kindRepository: Pick<KindRepository, "findKindById">,
  tagRepository: Pick<TagRepository, "countExistingTagsByIds">,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const normalizedTagIds = uniqTagIds(body.tagIds);

  const kind = await kindRepository.findKindById(body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const hasLocation = body.latitude !== undefined && body.longitude !== undefined;
  if (hasLocation && kind.label !== LOCATION_KIND_LABEL) {
    return fail(400, "latitude and longitude are allowed only for location kind");
  }

  const duplicated = await findEntityIdByKindAndNameFromD1(db, body.kindId, body.name);
  if (duplicated) {
    return fail(409, "entity already exists");
  }

  const hasValidTags = await validateTagIds(tagRepository, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const id = crypto.randomUUID();
  const inserted = await insertEntityWithTagsInD1(
    db,
    {
      id,
      kindId: body.kindId,
      name: body.name,
      description: toDescription(body.description),
      isWishlistFlag: toWishlistFlag(body.isWishlist),
      ...(hasLocation ? { latitude: body.latitude, longitude: body.longitude } : {})
    },
    normalizedTagIds
  );

  if (!inserted) {
    return fail(500, "failed to insert entity with tags");
  }

  const entity = await fetchEntityWithTagsFromD1(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
