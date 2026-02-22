import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import type { RelationRepository } from "../ports/relation-repository";

export async function deleteEntityRelationCommand(
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  relationRepository: Pick<RelationRepository, "deleteRelation">,
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

  const relationDeleted = await relationRepository.deleteRelation(entityId, relatedEntityId);
  if (relationDeleted === "not_found") {
    return fail(404, "relation not found");
  }
  if (relationDeleted === "error") {
    return fail(500, "failed to delete relation");
  }

  return success({});
}
