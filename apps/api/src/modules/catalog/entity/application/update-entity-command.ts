import type { KindRepository } from "../../kind/ports/kind-repository";
import type { EntityApplicationRepository } from "../ports/entity-application-repository";
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

export async function updateEntityCommand(
  entityRepository: Pick<
    EntityApplicationRepository,
    "findEntityIdByKindAndName" | "updateEntityWithTags" | "fetchEntityWithTags"
  >,
  kindRepository: Pick<KindRepository, "findKindById">,
  tagRepository: Pick<TagRepository, "countExistingTagsByIds">,
  id: string,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const kind = await kindRepository.findKindById(body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const hasLocation = body.latitude !== undefined && body.longitude !== undefined;
  if (hasLocation && kind.label !== LOCATION_KIND_LABEL) {
    return fail(400, "latitude and longitude are allowed only for location kind");
  }

  const duplicated = await entityRepository.findEntityIdByKindAndName(body.kindId, body.name);
  if (duplicated && duplicated.id !== id) {
    return fail(409, "entity already exists");
  }

  const normalizedTagIds = uniqTagIds(body.tagIds);
  const hasValidTags = await validateTagIds(tagRepository, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const updateResult = await entityRepository.updateEntityWithTags(
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

  if (updateResult === "not_found") {
    return fail(404, "entity not found");
  }
  if (updateResult === "error") {
    return fail(500, "failed to update entity");
  }

  const entity = await entityRepository.fetchEntityWithTags(id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
