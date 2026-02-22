import { createEntityCommand } from "../modules/catalog/entity/application/create-entity-command";
import { getEntityQuery } from "../modules/catalog/entity/application/get-entity-query";
import { listEntitiesQuery } from "../modules/catalog/entity/application/list-entities-query";
import type {
  EntityResponseDto,
  UpsertEntityCommand
} from "../modules/catalog/entity/application/entity-shared";
import { updateEntityCommand } from "../modules/catalog/entity/application/update-entity-command";
import type { UseCaseResult } from "./result";

export type { UpsertEntityCommand };

export async function listEntitiesUseCase(
  db: D1Database
): Promise<UseCaseResult<{ entities: EntityResponseDto[] }>> {
  return listEntitiesQuery(db);
}

export async function getEntityUseCase(
  db: D1Database,
  id: string
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  return getEntityQuery(db, id);
}

export async function createEntityUseCase(
  db: D1Database,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  return createEntityCommand(db, body);
}

export async function updateEntityUseCase(
  db: D1Database,
  id: string,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  return updateEntityCommand(db, id, body);
}
