import type { EntityRow, EntityTagRow, EntityWithTagsRow, TagRow } from "../domain/models";

type InsertEntityInput = {
  id: string;
  kindId: number;
  name: string;
  description: string | null;
  isWishlistFlag: number;
};

type UpdateEntityInput = {
  id: string;
  kindId: number;
  name: string;
  description: string | null;
  isWishlistFlag: number;
};

export async function listEntities(db: D1Database): Promise<EntityRow[]> {
  const result = await db
    .prepare(
      "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities ORDER BY created_at DESC LIMIT 50"
    )
    .all<EntityRow>();

  return result.results ?? [];
}

export async function findEntityById(db: D1Database, id: string): Promise<EntityRow | null> {
  const entity = await db
    .prepare(
      "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities WHERE id = ? LIMIT 1"
    )
    .bind(id)
    .first<EntityRow>();

  return entity ?? null;
}

export async function insertEntity(db: D1Database, input: InsertEntityInput): Promise<boolean> {
  const inserted = await db
    .prepare("INSERT INTO entities (id, kind_id, name, description, is_wishlist) VALUES (?, ?, ?, ?, ?)")
    .bind(input.id, input.kindId, input.name, input.description, input.isWishlistFlag)
    .run();

  return inserted.success;
}

export async function updateEntity(db: D1Database, input: UpdateEntityInput): Promise<boolean> {
  const updated = await db
    .prepare(
      "UPDATE entities SET kind_id = ?, name = ?, description = ?, is_wishlist = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(input.kindId, input.name, input.description, input.isWishlistFlag, input.id)
    .run();

  return updated.success;
}

export async function deleteEntity(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM entities WHERE id = ?").bind(id).run();
}

export async function replaceEntityTags(db: D1Database, entityId: string, tagIds: number[]): Promise<boolean> {
  const deleted = await db.prepare("DELETE FROM entity_tags WHERE entity_id = ?").bind(entityId).run();
  if (!deleted.success) {
    return false;
  }

  for (const tagId of tagIds) {
    const inserted = await db
      .prepare("INSERT INTO entity_tags (entity_id, tag_id) VALUES (?, ?)")
      .bind(entityId, tagId)
      .run();

    if (!inserted.success) {
      return false;
    }
  }

  return true;
}

export async function fetchTagsByEntityIds(db: D1Database, entityIds: string[]): Promise<Map<string, TagRow[]>> {
  const tagsByEntity = new Map<string, TagRow[]>();
  if (entityIds.length === 0) {
    return tagsByEntity;
  }

  const placeholders = entityIds.map(() => "?").join(", ");
  const tagsResult = await db
    .prepare(
      `SELECT et.entity_id, t.id, t.name
       FROM entity_tags et
       INNER JOIN tags t ON t.id = et.tag_id
       WHERE et.entity_id IN (${placeholders})
       ORDER BY t.name ASC, t.id ASC`
    )
    .bind(...entityIds)
    .all<EntityTagRow>();

  for (const row of tagsResult.results ?? []) {
    const current = tagsByEntity.get(row.entity_id);
    if (current) {
      current.push({ id: row.id, name: row.name });
      continue;
    }

    tagsByEntity.set(row.entity_id, [{ id: row.id, name: row.name }]);
  }

  return tagsByEntity;
}

export async function fetchEntityWithTags(db: D1Database, entityId: string): Promise<EntityWithTagsRow | null> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return null;
  }

  const tagsByEntity = await fetchTagsByEntityIds(db, [entityId]);
  return {
    ...entity,
    tags: tagsByEntity.get(entityId) ?? []
  };
}
