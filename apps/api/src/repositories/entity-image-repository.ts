import type { EntityImageRow } from "../domain/models";

type InsertEntityImageInput = {
  id: string;
  entityId: string;
  objectKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
};

type NextSortOrderRow = {
  next_sort_order: number;
};

export async function listEntityImages(db: D1Database, entityId: string): Promise<EntityImageRow[]> {
  const result = await db
    .prepare(
      `SELECT id, entity_id, object_key, file_name, mime_type, file_size, sort_order, created_at
       FROM entity_images
       WHERE entity_id = ?
       ORDER BY sort_order ASC, created_at ASC`
    )
    .bind(entityId)
    .all<EntityImageRow>();

  return result.results ?? [];
}

export async function findEntityImageById(
  db: D1Database,
  entityId: string,
  imageId: string
): Promise<EntityImageRow | null> {
  const image = await db
    .prepare(
      `SELECT id, entity_id, object_key, file_name, mime_type, file_size, sort_order, created_at
       FROM entity_images
       WHERE entity_id = ? AND id = ?
       LIMIT 1`
    )
    .bind(entityId, imageId)
    .first<EntityImageRow>();

  return image ?? null;
}

export async function nextEntityImageSortOrder(db: D1Database, entityId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
       FROM entity_images
       WHERE entity_id = ?`
    )
    .bind(entityId)
    .first<NextSortOrderRow>();

  return Number(row?.next_sort_order ?? 1);
}

export async function insertEntityImage(db: D1Database, input: InsertEntityImageInput): Promise<boolean> {
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

export async function deleteEntityImage(
  db: D1Database,
  entityId: string,
  imageId: string
): Promise<"deleted" | "not_found" | "error"> {
  const deleted = await db
    .prepare("DELETE FROM entity_images WHERE entity_id = ? AND id = ?")
    .bind(entityId, imageId)
    .run();

  if (!deleted.success) {
    return "error";
  }

  return Number(deleted.meta.changes ?? 0) > 0 ? "deleted" : "not_found";
}

export async function collapseEntityImageSortOrderAfterDelete(
  db: D1Database,
  entityId: string,
  deletedSortOrder: number
): Promise<boolean> {
  const updated = await db
    .prepare(
      `UPDATE entity_images
       SET sort_order = sort_order - 1
       WHERE entity_id = ? AND sort_order > ?`
    )
    .bind(entityId, deletedSortOrder)
    .run();

  return updated.success;
}

export async function reorderEntityImages(
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
  const results = await db.batch(statements);
  return results.every((result) => result.success);
}
