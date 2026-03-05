import type { EntityImageRecord } from "../../../../shared/db/records";
import { isSuccessfulD1UnitOfWork, runD1UnitOfWork } from "../../../../shared/db/unit-of-work";
import type {
  DeleteEntityImageResult,
  EntityImageRepository,
  InsertEntityImageInput
} from "../ports/entity-image-repository";

type NextSortOrderRecord = {
  next_sort_order: number;
};

export async function listEntityImagesFromD1(
  db: D1Database,
  entityId: string
): Promise<EntityImageRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, entity_id, object_key, file_name, mime_type, file_size, sort_order, created_at
       FROM entity_images
       WHERE entity_id = ?
       ORDER BY sort_order ASC, created_at ASC`
    )
    .bind(entityId)
    .all<EntityImageRecord>();

  return result.results ?? [];
}

export async function findEntityImageByIdFromD1(
  db: D1Database,
  entityId: string,
  imageId: string
): Promise<EntityImageRecord | null> {
  const image = await db
    .prepare(
      `SELECT id, entity_id, object_key, file_name, mime_type, file_size, sort_order, created_at
       FROM entity_images
       WHERE entity_id = ? AND id = ?
       LIMIT 1`
    )
    .bind(entityId, imageId)
    .first<EntityImageRecord>();

  return image ?? null;
}

export async function nextEntityImageSortOrderFromD1(db: D1Database, entityId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
       FROM entity_images
       WHERE entity_id = ?`
    )
    .bind(entityId)
    .first<NextSortOrderRecord>();

  return Number(row?.next_sort_order ?? 1);
}

export async function insertEntityImageInD1(
  db: D1Database,
  input: InsertEntityImageInput
): Promise<boolean> {
  const inserted = await db
    .prepare(
      `INSERT INTO entity_images (
        id, entity_id, object_key, file_name, mime_type, file_size, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.entityId,
      input.objectKey,
      input.fileName,
      input.mimeType,
      input.fileSize,
      input.sortOrder
    )
    .run();

  return inserted.success;
}

export async function deleteEntityImageAndCollapseSortOrderInD1(
  db: D1Database,
  entityId: string,
  imageId: string,
  deletedSortOrder: number
): Promise<DeleteEntityImageResult> {
  const results = await runD1UnitOfWork(db, [
    db.prepare("DELETE FROM entity_images WHERE entity_id = ? AND id = ?").bind(entityId, imageId),
    db
      .prepare(
        `UPDATE entity_images
         SET sort_order = sort_order - 1
         WHERE entity_id = ? AND sort_order > ?`
      )
      .bind(entityId, deletedSortOrder)
  ]);

  if (!results || !isSuccessfulD1UnitOfWork(results)) {
    return "error";
  }

  return Number(results[0]?.meta.changes ?? 0) > 0 ? "deleted" : "not_found";
}

export async function reorderEntityImagesInD1(
  db: D1Database,
  entityId: string,
  orderedImageIds: string[]
): Promise<boolean> {
  const statements = [
    db
      .prepare(
        `UPDATE entity_images
         SET sort_order = -sort_order
         WHERE entity_id = ?`
      )
      .bind(entityId),
    ...orderedImageIds.map((imageId, index) =>
      db
        .prepare(
          `UPDATE entity_images
           SET sort_order = ?
           WHERE entity_id = ? AND id = ?`
        )
        .bind(index + 1, entityId, imageId)
    )
  ];
  const results = await runD1UnitOfWork(db, statements);
  return results ? isSuccessfulD1UnitOfWork(results) : false;
}

export function createD1EntityImageRepository(db: D1Database): EntityImageRepository {
  return {
    listEntityImages: (entityId) => listEntityImagesFromD1(db, entityId),
    findEntityImageById: (entityId, imageId) => findEntityImageByIdFromD1(db, entityId, imageId),
    nextEntityImageSortOrder: (entityId) => nextEntityImageSortOrderFromD1(db, entityId),
    insertEntityImage: (input) => insertEntityImageInD1(db, input),
    deleteEntityImageAndCollapseSortOrder: (entityId, imageId, deletedSortOrder) =>
      deleteEntityImageAndCollapseSortOrderInD1(db, entityId, imageId, deletedSortOrder),
    reorderEntityImages: (entityId, orderedImageIds) => reorderEntityImagesInD1(db, entityId, orderedImageIds)
  };
}
