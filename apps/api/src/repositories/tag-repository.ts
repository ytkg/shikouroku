import type { TagRecord } from "../domain/models";
import {
  deleteTagWithRelationsFromD1,
  findTagByNameFromD1,
  insertTagToD1,
  listTagsFromD1
} from "../modules/catalog/tag/infra/tag-repository-d1";

export async function listTags(db: D1Database): Promise<TagRecord[]> {
  return listTagsFromD1(db);
}

export async function findTagByName(db: D1Database, name: string): Promise<TagRecord | null> {
  return findTagByNameFromD1(db, name);
}

export async function findTagById(db: D1Database, id: number): Promise<{ id: number } | null> {
  const tag = await db.prepare("SELECT id FROM tags WHERE id = ? LIMIT 1").bind(id).first<{ id: number }>();
  return tag ?? null;
}

export async function insertTag(db: D1Database, name: string): Promise<TagRecord | null> {
  return insertTagToD1(db, name);
}

export async function deleteTagAndRelations(
  db: D1Database,
  id: number
): Promise<"deleted" | "not_found" | "error"> {
  return deleteTagWithRelationsFromD1(db, id);
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
