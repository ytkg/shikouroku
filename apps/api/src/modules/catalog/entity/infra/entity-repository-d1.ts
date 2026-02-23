import type {
  EntityRecord,
  EntityTagRecord,
  EntityWithKindAndFirstImageRecord,
  EntityWithKindRecord,
  EntityWithTagsRecord,
  TagRecord
} from "../../../../shared/db/records";
import { isSuccessfulD1UnitOfWork, runD1UnitOfWork } from "../../../../shared/db/unit-of-work";
import type { EntityReadRepository } from "../ports/entity-read-repository";

export type InsertEntityInput = {
  id: string;
  kindId: number;
  name: string;
  description: string | null;
  isWishlistFlag: number;
};

export type UpdateEntityInput = {
  id: string;
  kindId: number;
  name: string;
  description: string | null;
  isWishlistFlag: number;
};

type EntitySearchMatch = "partial" | "prefix" | "exact";
type EntitySearchField = "title" | "body" | "tags";

export type ListEntitiesWithKindsInput = {
  limit: number;
  cursorCreatedAt: string | null;
  cursorId: string | null;
  kindId: number | null;
  wishlist: "include" | "exclude" | "only";
  q: string | null;
  match: EntitySearchMatch;
  fields: EntitySearchField[];
};

type ListEntitiesSearchInput = Pick<
  ListEntitiesWithKindsInput,
  "kindId" | "wishlist" | "q" | "match" | "fields"
>;

type ListEntitiesCursorInput = Pick<ListEntitiesWithKindsInput, "cursorCreatedAt" | "cursorId">;

function toCaseInsensitiveSearchCondition(column: string, match: EntitySearchMatch): string {
  if (match === "exact") {
    return `${column} = ? COLLATE NOCASE`;
  }

  if (match === "prefix") {
    return `INSTR(LOWER(${column}), LOWER(?)) = 1`;
  }

  return `INSTR(LOWER(${column}), LOWER(?)) > 0`;
}

function buildEntitySearchWhereClause(
  search: ListEntitiesSearchInput,
  cursor?: ListEntitiesCursorInput
): {
  whereClause: string;
  bindings: unknown[];
} {
  const clauses: string[] = [];
  const bindings: unknown[] = [];

  if (cursor?.cursorCreatedAt && cursor.cursorId) {
    clauses.push("(e.created_at < ? OR (e.created_at = ? AND e.id < ?))");
    bindings.push(cursor.cursorCreatedAt, cursor.cursorCreatedAt, cursor.cursorId);
  }

  if (search.kindId !== null) {
    clauses.push("e.kind_id = ?");
    bindings.push(search.kindId);
  }

  if (search.wishlist === "exclude") {
    clauses.push("e.is_wishlist = 0");
  }

  if (search.wishlist === "only") {
    clauses.push("e.is_wishlist = 1");
  }

  if (search.q) {
    const query = search.q;
    const searchClauses: string[] = [];

    if (search.fields.includes("title")) {
      searchClauses.push(toCaseInsensitiveSearchCondition("e.name", search.match));
      bindings.push(query);
    }

    if (search.fields.includes("body")) {
      searchClauses.push(toCaseInsensitiveSearchCondition("COALESCE(e.description, '')", search.match));
      bindings.push(query);
    }

    if (search.fields.includes("tags")) {
      searchClauses.push(
        `EXISTS (
           SELECT 1
           FROM entity_tags et
           INNER JOIN tags t ON t.id = et.tag_id
           WHERE et.entity_id = e.id
             AND ${toCaseInsensitiveSearchCondition("t.name", search.match)}
         )`
      );
      bindings.push(query);
    }

    if (searchClauses.length > 0) {
      clauses.push(`(${searchClauses.join(" OR ")})`);
    }
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    bindings
  };
}

export async function listEntitiesWithKindsFromD1(
  db: D1Database,
  input: ListEntitiesWithKindsInput
): Promise<EntityWithKindAndFirstImageRecord[]> {
  const { whereClause, bindings } = buildEntitySearchWhereClause(input, {
    cursorCreatedAt: input.cursorCreatedAt,
    cursorId: input.cursorId
  });
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
       ${whereClause}
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT ?`
    )
    .bind(...bindings, input.limit)
    .all<EntityWithKindAndFirstImageRecord>();

  return result.results ?? [];
}

export async function countEntitiesWithKindsFromD1(
  db: D1Database,
  input: ListEntitiesSearchInput
): Promise<number> {
  const { whereClause, bindings } = buildEntitySearchWhereClause(input);
  const count = await db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM entities e
       ${whereClause}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

  return Number(count?.total ?? 0);
}

export async function findEntityByIdFromD1(db: D1Database, id: string): Promise<EntityRecord | null> {
  const entity = await db
    .prepare(
      "SELECT id, kind_id, name, description, is_wishlist, created_at, updated_at FROM entities WHERE id = ? LIMIT 1"
    )
    .bind(id)
    .first<EntityRecord>();

  return entity ?? null;
}

export async function findEntityIdByKindAndNameFromD1(
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

export async function findEntityWithKindByIdFromD1(
  db: D1Database,
  id: string
): Promise<EntityWithKindRecord | null> {
  const entity = await db
    .prepare(
      `SELECT e.id, e.kind_id, k.label AS kind_label, e.name, e.description, e.is_wishlist, e.created_at, e.updated_at
       FROM entities e
       INNER JOIN kinds k ON k.id = e.kind_id
       WHERE e.id = ?
       LIMIT 1`
    )
    .bind(id)
    .first<EntityWithKindRecord>();

  return entity ?? null;
}

export async function fetchEntitiesWithKindsByIdsFromD1(
  db: D1Database,
  ids: string[]
): Promise<EntityWithKindRecord[]> {
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
    .all<EntityWithKindRecord>();

  return result.results ?? [];
}

export async function insertEntityInD1(db: D1Database, input: InsertEntityInput): Promise<boolean> {
  const inserted = await db
    .prepare("INSERT INTO entities (id, kind_id, name, description, is_wishlist) VALUES (?, ?, ?, ?, ?)")
    .bind(input.id, input.kindId, input.name, input.description, input.isWishlistFlag)
    .run();

  return inserted.success;
}

export async function insertEntityWithTagsInD1(
  db: D1Database,
  input: InsertEntityInput,
  tagIds: number[]
): Promise<boolean> {
  const statements = [
    db.prepare("INSERT INTO entities (id, kind_id, name, description, is_wishlist) VALUES (?, ?, ?, ?, ?)").bind(
      input.id,
      input.kindId,
      input.name,
      input.description,
      input.isWishlistFlag
    ),
    ...tagIds.map((tagId) => db.prepare("INSERT INTO entity_tags (entity_id, tag_id) VALUES (?, ?)").bind(input.id, tagId))
  ];

  const results = await runD1UnitOfWork(db, statements);
  return results ? isSuccessfulD1UnitOfWork(results) : false;
}

export async function updateEntityInD1(
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

export async function updateEntityWithTagsInD1(
  db: D1Database,
  input: UpdateEntityInput,
  tagIds: number[]
): Promise<"updated" | "not_found" | "error"> {
  const existing = await findEntityByIdFromD1(db, input.id);
  if (!existing) {
    return "not_found";
  }

  const statements = [
    db
      .prepare(
        "UPDATE entities SET kind_id = ?, name = ?, description = ?, is_wishlist = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(input.kindId, input.name, input.description, input.isWishlistFlag, input.id),
    db.prepare("DELETE FROM entity_tags WHERE entity_id = ?").bind(input.id),
    ...tagIds.map((tagId) => db.prepare("INSERT INTO entity_tags (entity_id, tag_id) VALUES (?, ?)").bind(input.id, tagId))
  ];

  const results = await runD1UnitOfWork(db, statements);
  if (!results || !isSuccessfulD1UnitOfWork(results)) {
    return "error";
  }

  return "updated";
}

export async function deleteEntityInD1(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM entities WHERE id = ?").bind(id).run();
}

export async function replaceEntityTagsInD1(
  db: D1Database,
  entityId: string,
  tagIds: number[]
): Promise<boolean> {
  const statements = [
    db.prepare("DELETE FROM entity_tags WHERE entity_id = ?").bind(entityId),
    ...tagIds.map((tagId) => db.prepare("INSERT INTO entity_tags (entity_id, tag_id) VALUES (?, ?)").bind(entityId, tagId))
  ];
  const results = await runD1UnitOfWork(db, statements);
  return results ? isSuccessfulD1UnitOfWork(results) : false;
}

export async function fetchTagsByEntityIdsFromD1(
  db: D1Database,
  entityIds: string[]
): Promise<Map<string, TagRecord[]>> {
  const tagsByEntity = new Map<string, TagRecord[]>();
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
    .all<EntityTagRecord>();

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

export async function fetchEntityWithTagsFromD1(
  db: D1Database,
  entityId: string
): Promise<EntityWithTagsRecord | null> {
  const entity = await findEntityByIdFromD1(db, entityId);
  if (!entity) {
    return null;
  }

  const tagsByEntity = await fetchTagsByEntityIdsFromD1(db, [entityId]);
  return {
    ...entity,
    tags: tagsByEntity.get(entityId) ?? []
  };
}

export function createD1EntityReadRepository(db: D1Database): EntityReadRepository {
  return {
    findEntityById: (id) => findEntityByIdFromD1(db, id),
    fetchEntitiesWithKindsByIds: (ids) => fetchEntitiesWithKindsByIdsFromD1(db, ids),
    fetchTagsByEntityIds: (entityIds) => fetchTagsByEntityIdsFromD1(db, entityIds)
  };
}
