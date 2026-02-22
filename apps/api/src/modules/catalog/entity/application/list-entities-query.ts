import { fetchTagsByEntityIds, listEntitiesWithKinds } from "../../../../repositories/entity-repository";
import { success, type UseCaseResult } from "../../../../usecases/result";
import { toEntityWithFirstImageResponse, type EntityResponseDto } from "./entity-shared";

export async function listEntitiesQuery(
  db: D1Database
): Promise<UseCaseResult<{ entities: EntityResponseDto[] }>> {
  const entities = await listEntitiesWithKinds(db);
  const tagsByEntity = await fetchTagsByEntityIds(
    db,
    entities.map((entity) => entity.id)
  );
  const entitiesWithKinds: EntityResponseDto[] = [];

  for (const entity of entities) {
    entitiesWithKinds.push(toEntityWithFirstImageResponse(entity, tagsByEntity.get(entity.id) ?? []));
  }

  return success({
    entities: entitiesWithKinds
  });
}
