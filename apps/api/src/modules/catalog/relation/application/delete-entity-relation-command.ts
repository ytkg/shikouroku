import { findEntityByIdFromD1 } from "../../entity/infra/entity-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
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
    findEntityByIdFromD1(db, entityId),
    findEntityByIdFromD1(db, relatedEntityId)
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
