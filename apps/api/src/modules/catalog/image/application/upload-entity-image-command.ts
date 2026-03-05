import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../ports/entity-image-repository";
import type { ImageCleanupTaskRepository } from "../../../maintenance/image-cleanup/ports/image-cleanup-task-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
  normalizeFileName,
  toEntityImageResponse,
  toErrorMessage,
  toFileExtension,
  type EntityImageResponseDto,
  type UploadImageFile
} from "./image-shared";

export async function uploadEntityImageCommand(
  imageBucket: R2Bucket,
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  entityImageRepository: Pick<EntityImageRepository, "nextEntityImageSortOrder" | "insertEntityImage">,
  imageCleanupTaskRepository: Pick<ImageCleanupTaskRepository, "enqueueTask">,
  entityId: string,
  file: UploadImageFile
): Promise<UseCaseResult<{ image: EntityImageResponseDto }>> {
  const entity = await entityReadRepository.findEntityById(entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  if (file.size <= 0) {
    return fail(400, "file is required");
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return fail(413, "file size exceeds 5MB");
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return fail(415, "unsupported image type");
  }

  const extension = toFileExtension(file.type);
  if (!extension) {
    return fail(415, "unsupported image type");
  }

  const imageId = crypto.randomUUID();
  const objectKey = `entities/${entityId}/${imageId}.${extension}`;
  const sortOrder = await entityImageRepository.nextEntityImageSortOrder(entityId);
  const fileName = normalizeFileName(file.name, `image.${extension}`);

  let imageBinary: ArrayBuffer;
  try {
    imageBinary = await file.arrayBuffer();
  } catch {
    return fail(400, "failed to read upload file");
  }

  try {
    await imageBucket.put(objectKey, imageBinary, {
      httpMetadata: {
        contentType: file.type
      }
    });
  } catch {
    return fail(500, "failed to upload image");
  }

  const inserted = await entityImageRepository.insertEntityImage({
    id: imageId,
    entityId,
    objectKey,
    fileName,
    mimeType: file.type,
    fileSize: file.size,
    sortOrder
  });
  if (!inserted) {
    try {
      await imageBucket.delete(objectKey);
    } catch (error) {
      const queued = await imageCleanupTaskRepository.enqueueTask(
        objectKey,
        "metadata_insert_failed",
        toErrorMessage(error)
      );
      if (queued === "error") {
        return fail(500, "failed to save image metadata");
      }
    }
    return fail(500, "failed to save image metadata");
  }

  return success({
    image: toEntityImageResponse({
      id: imageId,
      entity_id: entityId,
      object_key: objectKey,
      file_name: fileName,
      mime_type: file.type,
      file_size: file.size,
      sort_order: sortOrder,
      created_at: new Date().toISOString()
    })
  });
}
