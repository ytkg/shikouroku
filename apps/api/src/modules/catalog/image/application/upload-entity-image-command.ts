import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import {
  insertEntityImageInD1,
  nextEntityImageSortOrderFromD1
} from "../infra/image-repository-d1";
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
  db: D1Database,
  imageBucket: R2Bucket,
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
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
  const sortOrder = await nextEntityImageSortOrderFromD1(db, entityId);
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

  const inserted = await insertEntityImageInD1(db, {
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
      await imageCleanupTaskRepository.enqueueTask(objectKey, "metadata_insert_failed", toErrorMessage(error));
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
