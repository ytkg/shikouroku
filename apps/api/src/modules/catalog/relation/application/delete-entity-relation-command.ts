import { findEntityById } from "../../../../repositories/entity-repository";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import { deleteRelationInD1 } from "../infra/relation-repository-d1";

export async function deleteEntityRelationCommand(
  db: D1Database,
  entityId: string,
  relatedEntityId: string
): Promise<UseCaseResult<Record<string, never>>> {
  if (entityId === relatedEntityId) {
    return fail(400, "self relation is not allowed");
  }

  const [entity, relatedEntity] = await Promise.all([
    findEntityById(db, entityId),
    findEntityById(db, relatedEntityId)
  ]);
  if (!entity || !relatedEntity) {
    return fail(404, "entity not found");
  }

  const relationDeleted = await deleteRelationInD1(db, entityId, relatedEntityId);
  if (relationDeleted === "not_found") {
    return fail(404, "relation not found");
  }
  if (relationDeleted === "error") {
    return fail(500, "failed to delete relation");
  }

  return success({});
}
