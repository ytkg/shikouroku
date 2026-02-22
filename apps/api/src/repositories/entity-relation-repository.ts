import {
  createRelationInD1,
  deleteRelationInD1,
  listRelatedEntityIdsFromD1
} from "../modules/catalog/relation/infra/relation-repository-d1";

export async function listRelatedEntityIds(db: D1Database, entityId: string): Promise<string[]> {
  return listRelatedEntityIdsFromD1(db, entityId);
}

export async function createEntityRelation(
  db: D1Database,
  entityIdA: string,
  entityIdB: string
): Promise<"created" | "conflict" | "error"> {
  return createRelationInD1(db, entityIdA, entityIdB);
}

export async function deleteEntityRelation(
  db: D1Database,
  entityIdA: string,
  entityIdB: string
): Promise<"deleted" | "not_found" | "error"> {
  return deleteRelationInD1(db, entityIdA, entityIdB);
}
