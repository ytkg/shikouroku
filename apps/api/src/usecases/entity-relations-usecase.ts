import { createEntityRelationCommand } from "../modules/catalog/relation/application/create-entity-relation-command";
import { deleteEntityRelationCommand } from "../modules/catalog/relation/application/delete-entity-relation-command";
import {
  listRelatedEntitiesQuery,
  type RelatedEntityResponseDto
} from "../modules/catalog/relation/application/list-related-entities-query";
import type { UseCaseResult } from "./result";

export async function listRelatedEntitiesUseCase(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ related: RelatedEntityResponseDto[] }>> {
  return listRelatedEntitiesQuery(db, entityId);
}

export async function createEntityRelationUseCase(
  db: D1Database,
  entityId: string,
  relatedEntityId: string
): Promise<UseCaseResult<Record<string, never>>> {
  return createEntityRelationCommand(db, entityId, relatedEntityId);
}

export async function deleteEntityRelationUseCase(
  db: D1Database,
  entityId: string,
  relatedEntityId: string
): Promise<UseCaseResult<Record<string, never>>> {
  return deleteEntityRelationCommand(db, entityId, relatedEntityId);
}
