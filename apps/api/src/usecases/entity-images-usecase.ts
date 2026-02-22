import { deleteEntityImageCommand } from "../modules/catalog/image/application/delete-entity-image-command";
import { getEntityImageFileQuery } from "../modules/catalog/image/application/get-entity-image-file-query";
import {
  listEntityImagesQuery
} from "../modules/catalog/image/application/list-entity-images-query";
import { reorderEntityImagesCommand } from "../modules/catalog/image/application/reorder-entity-images-command";
import {
  uploadEntityImageCommand
} from "../modules/catalog/image/application/upload-entity-image-command";
import type {
  EntityImageResponseDto,
  UploadImageFile
} from "../modules/catalog/image/application/image-shared";
import type { UseCaseResult } from "./result";

export async function listEntityImagesUseCase(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ images: EntityImageResponseDto[] }>> {
  return listEntityImagesQuery(db, entityId);
}

export async function uploadEntityImageUseCase(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  file: UploadImageFile
): Promise<UseCaseResult<{ image: EntityImageResponseDto }>> {
  return uploadEntityImageCommand(db, imageBucket, entityId, file);
}

export async function deleteEntityImageUseCase(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  imageId: string
): Promise<UseCaseResult<Record<string, never>>> {
  return deleteEntityImageCommand(db, imageBucket, entityId, imageId);
}

export async function reorderEntityImagesUseCase(
  db: D1Database,
  entityId: string,
  orderedImageIds: string[]
): Promise<UseCaseResult<Record<string, never>>> {
  return reorderEntityImagesCommand(db, entityId, orderedImageIds);
}

export async function getEntityImageFileUseCase(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  imageId: string
) {
  return getEntityImageFileQuery(db, imageBucket, entityId, imageId);
}
