import type { EntityWithKindRecord, EntityWithTagsRecord, KindRecord, TagRecord } from "../../../../shared/db/records";
import {
  fetchEntitiesWithKindsByIdsFromD1,
  fetchTagsByEntityIdsFromD1,
  findEntityByIdFromD1
} from "../../entity/infra/entity-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import { listRelatedEntityIdsFromD1 } from "../infra/relation-repository-d1";

export type RelatedEntityResponseDto = {
  id: string;
  kind: KindRecord;
  name: string;
  description: string | null;
  is_wishlist: number;
  tags: TagRecord[];
  created_at: string;
  updated_at: string;
};

function toEntityWithTagsRecord(entity: EntityWithKindRecord, tags: TagRecord[]): EntityWithTagsRecord {
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

function toRelatedEntityResponseDto(entity: EntityWithTagsRecord, kind: KindRecord): RelatedEntityResponseDto {
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

export async function listRelatedEntitiesQuery(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ related: RelatedEntityResponseDto[] }>> {
  const entity = await findEntityByIdFromD1(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const relatedEntityIds = await listRelatedEntityIdsFromD1(db, entityId);
  if (relatedEntityIds.length === 0) {
    return success({ related: [] });
  }

  const relatedEntities = await fetchEntitiesWithKindsByIdsFromD1(db, relatedEntityIds);
  const tagsByEntity = await fetchTagsByEntityIdsFromD1(db, relatedEntityIds);
  const entityMap = new Map(relatedEntities.map((relatedEntity) => [relatedEntity.id, relatedEntity]));
  const related: RelatedEntityResponseDto[] = [];

  for (const relatedEntityId of relatedEntityIds) {
    const relatedEntity = entityMap.get(relatedEntityId);
    if (!relatedEntity) {
      continue;
    }

    related.push(
      toRelatedEntityResponseDto(
        toEntityWithTagsRecord(relatedEntity, tagsByEntity.get(relatedEntity.id) ?? []),
        { id: relatedEntity.kind_id, label: relatedEntity.kind_label }
      )
    );
  }

  return success({ related });
}
