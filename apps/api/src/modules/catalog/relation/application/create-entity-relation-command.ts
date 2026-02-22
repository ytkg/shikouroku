import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import type { RelationRepository } from "../ports/relation-repository";

export async function createEntityRelationCommand(
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  relationRepository: Pick<RelationRepository, "createRelation">,
  entityId: string,
  relatedEntityId: string
): Promise<UseCaseResult<Record<string, never>>> {
  if (entityId === relatedEntityId) {
    return fail(400, "self relation is not allowed");
  }

  const [entity, relatedEntity] = await Promise.all([
    entityReadRepository.findEntityById(entityId),
    entityReadRepository.findEntityById(relatedEntityId)
  ]);
  if (!entity || !relatedEntity) {
    return fail(404, "entity not found");
  }

  const relationCreated = await relationRepository.createRelation(entityId, relatedEntityId);
  if (relationCreated === "conflict") {
    return fail(409, "relation already exists");
  }
  if (relationCreated === "error") {
    return fail(500, "failed to create relation");
  }

  return success({});
}
