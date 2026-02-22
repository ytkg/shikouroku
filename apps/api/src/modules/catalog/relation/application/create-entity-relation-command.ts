import { findEntityByIdFromD1 } from "../../entity/infra/entity-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import { createRelationInD1 } from "../infra/relation-repository-d1";

export async function createEntityRelationCommand(
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

  const relationCreated = await createRelationInD1(db, entityId, relatedEntityId);
  if (relationCreated === "conflict") {
    return fail(409, "relation already exists");
  }
  if (relationCreated === "error") {
    return fail(500, "failed to create relation");
  }

  return success({});
}
