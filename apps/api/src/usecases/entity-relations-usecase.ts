import type { EntityWithKindRow, EntityWithTagsRow, KindRow, TagRow } from "../domain/models";
import {
  createEntityRelation,
  deleteEntityRelation,
  listRelatedEntityIds
} from "../repositories/entity-relation-repository";
import {
  fetchEntitiesWithKindsByIds,
  fetchTagsByEntityIds,
  findEntityById
} from "../repositories/entity-repository";
import { fail, success, type UseCaseResult } from "./result";

type RelatedEntityResponseRow = {
  id: string;
  kind: KindRow;
  name: string;
  description: string | null;
  is_wishlist: number;
  tags: TagRow[];
  created_at: string;
  updated_at: string;
};

function toEntityWithTagsRow(entity: EntityWithKindRow, tags: TagRow[]): EntityWithTagsRow {
  return {
    id: entity.id,
    kind_id: entity.kind_id,
    name: entity.name,
    description: entity.description,
    is_wishlist: entity.is_wishlist,
    tags,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  };
}

function toRelatedEntityResponse(entity: EntityWithTagsRow, kind: KindRow): RelatedEntityResponseRow {
  return {
    id: entity.id,
    kind,
    name: entity.name,
    description: entity.description,
    is_wishlist: entity.is_wishlist,
    tags: entity.tags,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  };
}

export async function listRelatedEntitiesUseCase(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ related: RelatedEntityResponseRow[] }>> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const relatedEntityIds = await listRelatedEntityIds(db, entityId);
  if (relatedEntityIds.length === 0) {
    return success({ related: [] });
  }

  const relatedEntities = await fetchEntitiesWithKindsByIds(db, relatedEntityIds);
  const tagsByEntity = await fetchTagsByEntityIds(db, relatedEntityIds);
  const entityMap = new Map(relatedEntities.map((relatedEntity) => [relatedEntity.id, relatedEntity]));
  const related: RelatedEntityResponseRow[] = [];

  for (const relatedEntityId of relatedEntityIds) {
    const relatedEntity = entityMap.get(relatedEntityId);
    if (!relatedEntity) {
      continue;
    }

    related.push(
      toRelatedEntityResponse(
        toEntityWithTagsRow(relatedEntity, tagsByEntity.get(relatedEntity.id) ?? []),
        { id: relatedEntity.kind_id, label: relatedEntity.kind_label }
      )
    );
  }

  return success({ related });
}

export async function createEntityRelationUseCase(
  db: D1Database,
  entityId: string,
  relatedEntityId: string
): Promise<UseCaseResult<Record<string, never>>> {
  if (entityId === relatedEntityId) {
    return fail(400, "self relation is not allowed");
  }

  const [entity, relatedEntity] = await Promise.all([
    findEntityById(db, entityId),
    findEntityById(db, relatedEntityId)
  ]);
  if (!entity || !relatedEntity) {
    return fail(404, "entity not found");
  }

  const relationCreated = await createEntityRelation(db, entityId, relatedEntityId);
  if (relationCreated === "conflict") {
    return fail(409, "relation already exists");
  }
  if (relationCreated === "error") {
    return fail(500, "failed to create relation");
  }

  return success({});
}

export async function deleteEntityRelationUseCase(
  db: D1Database,
  entityId: string,
  relatedEntityId: string
): Promise<UseCaseResult<Record<string, never>>> {
  if (entityId === relatedEntityId) {
    return fail(400, "self relation is not allowed");
  }

  const [entity, relatedEntity] = await Promise.all([
    findEntityById(db, entityId),
    findEntityById(db, relatedEntityId)
  ]);
  if (!entity || !relatedEntity) {
    return fail(404, "entity not found");
  }

  const relationDeleted = await deleteEntityRelation(db, entityId, relatedEntityId);
  if (relationDeleted === "not_found") {
    return fail(404, "relation not found");
  }
  if (relationDeleted === "error") {
    return fail(500, "failed to delete relation");
  }

  return success({});
}
