import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import type { EntityApplicationRepository } from "../ports/entity-application-repository";
import { toEntityResponse, toEntityWithTagsRecord, type EntityResponseDto } from "./entity-shared";

export async function getEntityQuery(
  entityRepository: Pick<
    EntityApplicationRepository,
    "findEntityWithKindById" | "fetchTagsByEntityIds" | "findEntityLocationByEntityId"
  >,
  id: string
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const entity = await entityRepository.findEntityWithKindById(id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const tagsByEntity = await entityRepository.fetchTagsByEntityIds([id]);
  const location = await entityRepository.findEntityLocationByEntityId(id);

  return success({
    entity: toEntityResponse(
      toEntityWithTagsRecord(entity, tagsByEntity.get(id) ?? []),
      { id: entity.kind_id, label: entity.kind_label },
      undefined,
      location
    )
  });
}
