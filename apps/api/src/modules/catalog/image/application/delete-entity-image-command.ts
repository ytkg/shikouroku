import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../ports/entity-image-repository";
import type { ImageCleanupTaskRepository } from "../../../maintenance/image-cleanup/ports/image-cleanup-task-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import { toErrorMessage } from "./image-shared";

export async function deleteEntityImageCommand(
  imageBucket: R2Bucket,
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  entityImageRepository: Pick<
    EntityImageRepository,
    "findEntityImageById" | "deleteEntityImageAndCollapseSortOrder"
  >,
  imageCleanupTaskRepository: Pick<ImageCleanupTaskRepository, "enqueueTask">,
  entityId: string,
  imageId: string
): Promise<UseCaseResult<Record<string, never>>> {
  const entity = await entityReadRepository.findEntityById(entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const image = await entityImageRepository.findEntityImageById(entityId, imageId);
  if (!image) {
    return fail(404, "image not found");
  }

  const deleted = await entityImageRepository.deleteEntityImageAndCollapseSortOrder(entityId, imageId, image.sort_order);
  if (deleted === "not_found") {
    return fail(404, "image not found");
  }
  if (deleted === "error") {
    return fail(500, "failed to delete image metadata");
  }

  try {
    await imageBucket.delete(image.object_key);
  } catch (error) {
    const queued = await imageCleanupTaskRepository.enqueueTask(
      image.object_key,
      "entity_image_delete_failed",
      toErrorMessage(error)
    );
    if (queued !== "enqueued") {
      return fail(500, "failed to delete image file and schedule cleanup");
    }
  }

  return success({});
}
