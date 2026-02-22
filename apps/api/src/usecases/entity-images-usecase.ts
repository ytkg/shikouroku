import type { EntityImageRecord } from "../domain/models";
import { findEntityById } from "../repositories/entity-repository";
import {
  collapseEntityImageSortOrderAfterDelete,
  deleteEntityImage,
  findEntityImageById,
  insertEntityImage,
  listEntityImages,
  nextEntityImageSortOrder,
  reorderEntityImages
} from "../repositories/entity-image-repository";
import { enqueueImageCleanupTask } from "../repositories/image-cleanup-task-repository";
import { fail, success, type UseCaseResult } from "./result";

const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type EntityImageResponseDto = {
  id: string;
  entity_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  url: string;
  created_at: string;
};

type UploadImageFile = Pick<File, "name" | "type" | "size" | "arrayBuffer">;

function toImageFilePath(entityId: string, imageId: string): string {
  return `/api/entities/${encodeURIComponent(entityId)}/images/${encodeURIComponent(imageId)}/file`;
}

function toEntityImageResponse(image: EntityImageRecord): EntityImageResponseDto {
  return {
    id: image.id,
    entity_id: image.entity_id,
    file_name: image.file_name,
    mime_type: image.mime_type,
    file_size: image.file_size,
    sort_order: image.sort_order,
    url: toImageFilePath(image.entity_id, image.id),
    created_at: image.created_at
  };
}

function toFileExtension(mimeType: string): string | null {
  if (mimeType === "image/jpeg") return "jpeg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return null;
}

function normalizeFileName(fileName: string, fallback: string): string {
  const normalized = fileName.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function hasSameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }

  return true;
}

function toErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export async function listEntityImagesUseCase(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ images: EntityImageResponseDto[] }>> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const images = await listEntityImages(db, entityId);
  return success({
    images: images.map(toEntityImageResponse)
  });
}

export async function uploadEntityImageUseCase(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  file: UploadImageFile
): Promise<UseCaseResult<{ image: EntityImageResponseDto }>> {
  const entity = await findEntityById(db, entityId);
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
  const sortOrder = await nextEntityImageSortOrder(db, entityId);
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

  const inserted = await insertEntityImage(db, {
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
      await enqueueImageCleanupTask(db, objectKey, "metadata_insert_failed", toErrorMessage(error));
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

export async function deleteEntityImageUseCase(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  imageId: string
): Promise<UseCaseResult<Record<string, never>>> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const image = await findEntityImageById(db, entityId, imageId);
  if (!image) {
    return fail(404, "image not found");
  }

  const deleted = await deleteEntityImage(db, entityId, imageId);
  if (deleted === "not_found") {
    return fail(404, "image not found");
  }
  if (deleted === "error") {
    return fail(500, "failed to delete image metadata");
  }

  const collapsed = await collapseEntityImageSortOrderAfterDelete(db, entityId, image.sort_order);
  if (!collapsed) {
    return fail(500, "failed to update image sort order");
  }

  try {
    await imageBucket.delete(image.object_key);
  } catch (error) {
    const queued = await enqueueImageCleanupTask(
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

export async function reorderEntityImagesUseCase(
  db: D1Database,
  entityId: string,
  orderedImageIds: string[]
): Promise<UseCaseResult<Record<string, never>>> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const uniqueImageIds = new Set(orderedImageIds);
  if (uniqueImageIds.size !== orderedImageIds.length) {
    return fail(400, "orderedImageIds must be unique");
  }

  const currentImages = await listEntityImages(db, entityId);
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

  const reordered = await reorderEntityImages(db, entityId, orderedImageIds);
  if (!reordered) {
    return fail(500, "failed to reorder images");
  }

  return success({});
}

export async function getEntityImageFileUseCase(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  imageId: string
): Promise<
  UseCaseResult<{
    image: EntityImageRecord;
    file: R2ObjectBody;
  }>
> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const image = await findEntityImageById(db, entityId, imageId);
  if (!image) {
    return fail(404, "image not found");
  }

  const file = await imageBucket.get(image.object_key);
  if (!file || !file.body) {
    return fail(404, "image file not found");
  }

  return success({
    image,
    file
  });
}
