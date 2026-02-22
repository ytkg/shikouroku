import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import { fetchTagsByEntityIds, findEntityWithKindById } from "../../../../repositories/entity-repository";
import { toEntityResponse, toEntityWithTagsRecord, type EntityResponseDto } from "./entity-shared";

export async function getEntityQuery(
  db: D1Database,
  id: string
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const entity = await findEntityWithKindById(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const tagsByEntity = await fetchTagsByEntityIds(db, [id]);

  return success({
    entity: toEntityResponse(
      toEntityWithTagsRecord(entity, tagsByEntity.get(id) ?? []),
      { id: entity.kind_id, label: entity.kind_label }
    )
  });
}
