import {
  fetchTagsByEntityIdsFromD1,
  listEntitiesWithKindsFromD1
} from "../infra/entity-repository-d1";
import { success, type UseCaseResult } from "../../../../shared/application/result";
import { toEntityWithFirstImageResponse, type EntityResponseDto } from "./entity-shared";

export async function listEntitiesQuery(
  db: D1Database
): Promise<UseCaseResult<{ entities: EntityResponseDto[] }>> {
  const entities = await listEntitiesWithKindsFromD1(db);
  const tagsByEntity = await fetchTagsByEntityIdsFromD1(
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
