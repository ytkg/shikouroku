import type { TagRow } from "../domain/models";

export async function listTags(db: D1Database): Promise<TagRow[]> {
  const result = await db.prepare("SELECT id, name FROM tags ORDER BY name ASC, id ASC").all<TagRow>();
  return result.results ?? [];
}

export async function findTagByName(db: D1Database, name: string): Promise<TagRow | null> {
  const tag = await db.prepare("SELECT id, name FROM tags WHERE name = ? LIMIT 1").bind(name).first<TagRow>();
  return tag ?? null;
}

export async function findTagById(db: D1Database, id: number): Promise<{ id: number } | null> {
  const tag = await db.prepare("SELECT id FROM tags WHERE id = ? LIMIT 1").bind(id).first<{ id: number }>();
  return tag ?? null;
}

export async function insertTag(db: D1Database, name: string): Promise<TagRow | null> {
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

export async function deleteTagAndRelations(
  db: D1Database,
  id: number
): Promise<"deleted" | "not_found" | "error"> {
  try {
    const results = await db.batch([
      db.prepare("DELETE FROM entity_tags WHERE tag_id = ?").bind(id),
      db.prepare("DELETE FROM tags WHERE id = ?").bind(id)
    ]);
    if (!results.every((result) => result.success)) {
      return "error";
    }

    const tagDeleted = results[1];
    return Number(tagDeleted.meta.changes ?? 0) > 0 ? "deleted" : "not_found";
  } catch {
    return "error";
  }
}

export async function countExistingTagsByIds(db: D1Database, tagIds: number[]): Promise<number> {
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
