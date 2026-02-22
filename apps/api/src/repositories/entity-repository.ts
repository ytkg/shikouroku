import type {
  EntityRow,
  EntityTagRow,
  EntityWithKindAndFirstImageRow,
  EntityWithKindRow,
  EntityWithTagsRow,
  TagRow
} from "../domain/models";

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

export async function listEntitiesWithKinds(db: D1Database): Promise<EntityWithKindAndFirstImageRow[]> {
  const result = await db
    .prepare(
      `SELECT
         e.id,
         e.kind_id,
         k.label AS kind_label,
         e.name,
         e.description,
         e.is_wishlist,
         e.created_at,
         e.updated_at,
         (
           SELECT ei.id
           FROM entity_images ei
           WHERE ei.entity_id = e.id
           ORDER BY ei.sort_order ASC, ei.created_at ASC
           LIMIT 1
         ) AS first_image_id
       FROM entities e
       INNER JOIN kinds k ON k.id = e.kind_id
       ORDER BY e.created_at DESC
       LIMIT 50`
    )
    .all<EntityWithKindAndFirstImageRow>();

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

export async function findEntityIdByKindAndName(
  db: D1Database,
  kindId: number,
  name: string
): Promise<{ id: string } | null> {
  const entity = await db
    .prepare("SELECT id FROM entities WHERE kind_id = ? AND name = ? LIMIT 1")
    .bind(kindId, name)
    .first<{ id: string }>();

  return entity ?? null;
}

export async function findEntityWithKindById(db: D1Database, id: string): Promise<EntityWithKindRow | null> {
  const entity = await db
    .prepare(
      `SELECT e.id, e.kind_id, k.label AS kind_label, e.name, e.description, e.is_wishlist, e.created_at, e.updated_at
       FROM entities e
       INNER JOIN kinds k ON k.id = e.kind_id
       WHERE e.id = ?
       LIMIT 1`
    )
    .bind(id)
    .first<EntityWithKindRow>();

  return entity ?? null;
}

export async function fetchEntitiesWithKindsByIds(
  db: D1Database,
  ids: string[]
): Promise<EntityWithKindRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const placeholders = ids.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT e.id, e.kind_id, k.label AS kind_label, e.name, e.description, e.is_wishlist, e.created_at, e.updated_at
       FROM entities e
       INNER JOIN kinds k ON k.id = e.kind_id
       WHERE e.id IN (${placeholders})`
    )
    .bind(...ids)
    .all<EntityWithKindRow>();

  return result.results ?? [];
}

export async function insertEntity(db: D1Database, input: InsertEntityInput): Promise<boolean> {
  const inserted = await db
    .prepare("INSERT INTO entities (id, kind_id, name, description, is_wishlist) VALUES (?, ?, ?, ?, ?)")
    .bind(input.id, input.kindId, input.name, input.description, input.isWishlistFlag)
    .run();

  return inserted.success;
}

export async function updateEntity(
  db: D1Database,
  input: UpdateEntityInput
): Promise<"updated" | "not_found" | "error"> {
  const updated = await db
    .prepare(
      "UPDATE entities SET kind_id = ?, name = ?, description = ?, is_wishlist = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(input.kindId, input.name, input.description, input.isWishlistFlag, input.id)
    .run();

  if (!updated.success) {
    return "error";
  }

  return Number(updated.meta.changes ?? 0) > 0 ? "updated" : "not_found";
}

export async function deleteEntity(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM entities WHERE id = ?").bind(id).run();
}

export async function replaceEntityTags(db: D1Database, entityId: string, tagIds: number[]): Promise<boolean> {
  const statements = [
    db.prepare("DELETE FROM entity_tags WHERE entity_id = ?").bind(entityId),
    ...tagIds.map((tagId) => db.prepare("INSERT INTO entity_tags (entity_id, tag_id) VALUES (?, ?)").bind(entityId, tagId))
  ];
  const results = await db.batch(statements);

  return results.every((result) => result.success);
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
