import type {
  CreateRelationResult,
  DeleteRelationResult,
  RelationRepository
} from "../ports/relation-repository";

type RelatedEntityIdRecord = {
  related_id: string;
};

function normalizeEntityPair(entityIdA: string, entityIdB: string): [string, string] {
  return entityIdA < entityIdB ? [entityIdA, entityIdB] : [entityIdB, entityIdA];
}

export async function listRelatedEntityIdsFromD1(db: D1Database, entityId: string): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT CASE
          WHEN entity_id_low = ? THEN entity_id_high
          ELSE entity_id_low
        END AS related_id
       FROM entity_relations
       WHERE entity_id_low = ? OR entity_id_high = ?
       ORDER BY created_at DESC`
    )
    .bind(entityId, entityId, entityId)
    .all<RelatedEntityIdRecord>();

  return (result.results ?? []).map((row) => row.related_id);
}

export async function createRelationInD1(
  db: D1Database,
  entityIdA: string,
  entityIdB: string
): Promise<CreateRelationResult> {
  const [entityIdLow, entityIdHigh] = normalizeEntityPair(entityIdA, entityIdB);
  const created = await db
    .prepare(
      "INSERT OR IGNORE INTO entity_relations (entity_id_low, entity_id_high) VALUES (?, ?)"
    )
    .bind(entityIdLow, entityIdHigh)
    .run();

  if (!created.success) {
    return "error";
  }

  return Number(created.meta.changes ?? 0) > 0 ? "created" : "conflict";
}

export async function deleteRelationInD1(
  db: D1Database,
  entityIdA: string,
  entityIdB: string
): Promise<DeleteRelationResult> {
  const [entityIdLow, entityIdHigh] = normalizeEntityPair(entityIdA, entityIdB);
  const deleted = await db
    .prepare(
      "DELETE FROM entity_relations WHERE entity_id_low = ? AND entity_id_high = ?"
    )
    .bind(entityIdLow, entityIdHigh)
    .run();

  if (!deleted.success) {
    return "error";
  }

  return Number(deleted.meta.changes ?? 0) > 0 ? "deleted" : "not_found";
}

export function createD1RelationRepository(db: D1Database): RelationRepository {
  return {
    listRelatedEntityIds: (entityId) => listRelatedEntityIdsFromD1(db, entityId),
    createRelation: (entityIdA, entityIdB) => createRelationInD1(db, entityIdA, entityIdB),
    deleteRelation: (entityIdA, entityIdB) => deleteRelationInD1(db, entityIdA, entityIdB)
  };
}
