import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../ports/entity-image-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import { hasSameIds } from "./image-shared";

export async function reorderEntityImagesCommand(
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  entityImageRepository: Pick<EntityImageRepository, "listEntityImages" | "reorderEntityImages">,
  entityId: string,
  orderedImageIds: string[]
): Promise<UseCaseResult<Record<string, never>>> {
  const entity = await entityReadRepository.findEntityById(entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const uniqueImageIds = new Set(orderedImageIds);
  if (uniqueImageIds.size !== orderedImageIds.length) {
    return fail(400, "orderedImageIds must be unique");
  }

  const currentImages = await entityImageRepository.listEntityImages(entityId);
  const currentImageIds = currentImages.map((image) => image.id);
  if (currentImageIds.length !== orderedImageIds.length) {
    return fail(400, "orderedImageIds must include all entity images");
  }

  const currentImageIdSet = new Set(currentImageIds);
  for (const orderedImageId of orderedImageIds) {
    if (!currentImageIdSet.has(orderedImageId)) {
      return fail(400, "orderedImageIds contains unknown image id");
    }
  }

  if (hasSameIds(currentImageIds, orderedImageIds)) {
    return success({});
  }

  const reordered = await entityImageRepository.reorderEntityImages(entityId, orderedImageIds);
  if (!reordered) {
    return fail(500, "failed to reorder images");
  }

  return success({});
}
