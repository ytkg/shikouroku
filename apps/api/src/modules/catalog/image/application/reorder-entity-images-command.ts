import { findEntityByIdFromD1 } from "../../entity/infra/entity-repository-d1";
import { listEntityImagesFromD1, reorderEntityImagesInD1 } from "../infra/image-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import { hasSameIds } from "./image-shared";

export async function reorderEntityImagesCommand(
  db: D1Database,
  entityId: string,
  orderedImageIds: string[]
): Promise<UseCaseResult<Record<string, never>>> {
  const entity = await findEntityByIdFromD1(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const uniqueImageIds = new Set(orderedImageIds);
  if (uniqueImageIds.size !== orderedImageIds.length) {
    return fail(400, "orderedImageIds must be unique");
  }

  const currentImages = await listEntityImagesFromD1(db, entityId);
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

  const reordered = await reorderEntityImagesInD1(db, entityId, orderedImageIds);
  if (!reordered) {
    return fail(500, "failed to reorder images");
  }

  return success({});
}
