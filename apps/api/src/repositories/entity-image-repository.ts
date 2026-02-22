import type { EntityImageRecord } from "../domain/models";
import {
  collapseEntityImageSortOrderAfterDeleteInD1,
  deleteEntityImageInD1,
  findEntityImageByIdFromD1,
  insertEntityImageInD1,
  listEntityImagesFromD1,
  nextEntityImageSortOrderFromD1,
  reorderEntityImagesInD1
} from "../modules/catalog/image/infra/image-repository-d1";

type InsertEntityImageInput = {
  id: string;
  entityId: string;
  objectKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
};

export async function listEntityImages(db: D1Database, entityId: string): Promise<EntityImageRecord[]> {
  return listEntityImagesFromD1(db, entityId);
}

export async function findEntityImageById(
  db: D1Database,
  entityId: string,
  imageId: string
): Promise<EntityImageRecord | null> {
  return findEntityImageByIdFromD1(db, entityId, imageId);
}

export async function nextEntityImageSortOrder(db: D1Database, entityId: string): Promise<number> {
  return nextEntityImageSortOrderFromD1(db, entityId);
}

export async function insertEntityImage(db: D1Database, input: InsertEntityImageInput): Promise<boolean> {
  return insertEntityImageInD1(db, input);
}

export async function deleteEntityImage(
  db: D1Database,
  entityId: string,
  imageId: string
): Promise<"deleted" | "not_found" | "error"> {
  return deleteEntityImageInD1(db, entityId, imageId);
}

export async function collapseEntityImageSortOrderAfterDelete(
  db: D1Database,
  entityId: string,
  deletedSortOrder: number
): Promise<boolean> {
  return collapseEntityImageSortOrderAfterDeleteInD1(db, entityId, deletedSortOrder);
}

export async function reorderEntityImages(
  db: D1Database,
  entityId: string,
  orderedImageIds: string[]
): Promise<boolean> {
  return reorderEntityImagesInD1(db, entityId, orderedImageIds);
}
