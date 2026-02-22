import type { TagRecord } from "../../../../domain/models";
import { isSuccessfulD1UnitOfWork, runD1UnitOfWork } from "../../../../shared/db/unit-of-work";

export async function listTagsFromD1(db: D1Database): Promise<TagRecord[]> {
  const result = await db.prepare("SELECT id, name FROM tags ORDER BY name ASC, id ASC").all<TagRecord>();
  return result.results ?? [];
}

export async function findTagByNameFromD1(db: D1Database, name: string): Promise<TagRecord | null> {
  const tag = await db.prepare("SELECT id, name FROM tags WHERE name = ? LIMIT 1").bind(name).first<TagRecord>();
  return tag ?? null;
}

export async function insertTagToD1(db: D1Database, name: string): Promise<TagRecord | null> {
  const inserted = await db.prepare("INSERT INTO tags (name) VALUES (?)").bind(name).run();
  if (!inserted.success) {
    return null;
  }

  const id = Number(inserted.meta.last_row_id);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { id, name };
}

export async function deleteTagWithRelationsFromD1(
  db: D1Database,
  id: number
): Promise<"deleted" | "not_found" | "error"> {
  const results = await runD1UnitOfWork(db, [
    db.prepare("DELETE FROM entity_tags WHERE tag_id = ?").bind(id),
    db.prepare("DELETE FROM tags WHERE id = ?").bind(id)
  ]);
  if (!results || !isSuccessfulD1UnitOfWork(results)) {
    return "error";
  }

  const tagDeleted = results[1];
  return Number(tagDeleted?.meta.changes ?? 0) > 0 ? "deleted" : "not_found";
}

export async function countExistingTagsByIdsFromD1(db: D1Database, tagIds: number[]): Promise<number> {
  if (tagIds.length === 0) {
    return 0;
  }

  const placeholders = tagIds.map(() => "?").join(", ");
  const result = await db
    .prepare(`SELECT id FROM tags WHERE id IN (${placeholders})`)
    .bind(...tagIds)
    .all<{ id: number }>();

  return (result.results ?? []).length;
}
