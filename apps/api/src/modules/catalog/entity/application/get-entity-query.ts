import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import {
  fetchTagsByEntityIdsFromD1,
  findEntityWithKindByIdFromD1
} from "../infra/entity-repository-d1";
import { toEntityResponse, toEntityWithTagsRecord, type EntityResponseDto } from "./entity-shared";

export async function getEntityQuery(
  db: D1Database,
  id: string
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const entity = await findEntityWithKindByIdFromD1(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const tagsByEntity = await fetchTagsByEntityIdsFromD1(db, [id]);

  return success({
    entity: toEntityResponse(
      toEntityWithTagsRecord(entity, tagsByEntity.get(id) ?? []),
      { id: entity.kind_id, label: entity.kind_label }
    )
  });
}
