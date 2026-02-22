import { findEntityByIdFromD1 } from "../../entity/infra/entity-repository-d1";
import {
  collapseEntityImageSortOrderAfterDeleteInD1,
  deleteEntityImageInD1,
  findEntityImageByIdFromD1
} from "../infra/image-repository-d1";
import { enqueueImageCleanupTaskToD1 } from "../../../maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import { toErrorMessage } from "./image-shared";

export async function deleteEntityImageCommand(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  imageId: string
): Promise<UseCaseResult<Record<string, never>>> {
  const entity = await findEntityByIdFromD1(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const image = await findEntityImageByIdFromD1(db, entityId, imageId);
  if (!image) {
    return fail(404, "image not found");
  }

  const deleted = await deleteEntityImageInD1(db, entityId, imageId);
  if (deleted === "not_found") {
    return fail(404, "image not found");
  }
  if (deleted === "error") {
    return fail(500, "failed to delete image metadata");
  }

  const collapsed = await collapseEntityImageSortOrderAfterDeleteInD1(db, entityId, image.sort_order);
  if (!collapsed) {
    return fail(500, "failed to update image sort order");
  }

  try {
    await imageBucket.delete(image.object_key);
  } catch (error) {
    const queued = await enqueueImageCleanupTaskToD1(
      db,
      image.object_key,
      "entity_image_delete_failed",
      toErrorMessage(error)
    );
    if (!queued) {
      return fail(500, "failed to delete image file and schedule cleanup");
    }
  }

  return success({});
}
