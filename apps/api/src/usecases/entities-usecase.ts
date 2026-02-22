import type {
  EntityWithKindAndFirstImageRecord,
  EntityWithKindRecord,
  EntityWithTagsRecord,
  KindRecord,
  TagRecord
} from "../domain/models";
import { findKindById } from "../repositories/kind-repository";
import {
  deleteEntity,
  findEntityIdByKindAndName,
  findEntityWithKindById,
  fetchEntityWithTags,
  fetchTagsByEntityIds,
  insertEntity,
  listEntitiesWithKinds,
  replaceEntityTags,
  updateEntity
} from "../repositories/entity-repository";
import { countExistingTagsByIds } from "../repositories/tag-repository";
import { fail, success, type UseCaseResult } from "./result";

export type UpsertEntityCommand = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
};

type EntityResponseDto = {
  id: string;
  kind: KindRecord;
  name: string;
  description: string | null;
  is_wishlist: number;
  tags: TagRecord[];
  first_image_url?: string | null;
  created_at: string;
  updated_at: string;
};

function uniqTagIds(tagIds: number[]): number[] {
  return [...new Set(tagIds)];
}

async function validateTagIds(db: D1Database, tagIds: number[]): Promise<boolean> {
  if (tagIds.length === 0) {
    return true;
  }

  const count = await countExistingTagsByIds(db, tagIds);
  return count === tagIds.length;
}

function toDescription(value: string): string | null {
  return value.length > 0 ? value : null;
}

function toWishlistFlag(value: boolean): number {
  return value ? 1 : 0;
}

function toImageFilePath(entityId: string, imageId: string): string {
  return `/api/entities/${encodeURIComponent(entityId)}/images/${encodeURIComponent(imageId)}/file`;
}

function toEntityResponse(
  entity: EntityWithTagsRecord,
  kind: KindRecord,
  firstImageId?: string | null
): EntityResponseDto {
  return {
    id: entity.id,
    kind,
    name: entity.name,
    description: entity.description,
    is_wishlist: entity.is_wishlist,
    tags: entity.tags,
    ...(firstImageId !== undefined
      ? {
          first_image_url: firstImageId ? toImageFilePath(entity.id, firstImageId) : null
        }
      : {}),
    created_at: entity.created_at,
    updated_at: entity.updated_at
  };
}

function toEntityWithTagsRow(entity: EntityWithKindRecord, tags: TagRecord[]): EntityWithTagsRecord {
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

function toEntityWithFirstImageResponse(
  entity: EntityWithKindAndFirstImageRecord,
  tags: TagRecord[]
): EntityResponseDto {
  return toEntityResponse(
    toEntityWithTagsRow(entity, tags),
    { id: entity.kind_id, label: entity.kind_label },
    entity.first_image_id
  );
}

export async function listEntitiesUseCase(
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

export async function getEntityUseCase(
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
      toEntityWithTagsRow(entity, tagsByEntity.get(id) ?? []),
      { id: entity.kind_id, label: entity.kind_label }
    )
  });
}

export async function createEntityUseCase(
  db: D1Database,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const normalizedTagIds = uniqTagIds(body.tagIds);

  const kind = await findKindById(db, body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const duplicated = await findEntityIdByKindAndName(db, body.kindId, body.name);
  if (duplicated) {
    return fail(409, "entity already exists");
  }

  const hasValidTags = await validateTagIds(db, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const id = crypto.randomUUID();
  const inserted = await insertEntity(db, {
    id,
    kindId: body.kindId,
    name: body.name,
    description: toDescription(body.description),
    isWishlistFlag: toWishlistFlag(body.isWishlist)
  });

  if (!inserted) {
    return fail(500, "failed to insert entity");
  }

  const tagsInserted = await replaceEntityTags(db, id, normalizedTagIds);
  if (!tagsInserted) {
    await deleteEntity(db, id);
    return fail(500, "failed to insert entity tags");
  }

  const entity = await fetchEntityWithTags(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}

export async function updateEntityUseCase(
  db: D1Database,
  id: string,
  body: UpsertEntityCommand
): Promise<UseCaseResult<{ entity: EntityResponseDto }>> {
  const kind = await findKindById(db, body.kindId);
  if (!kind) {
    return fail(400, "kind not found");
  }

  const duplicated = await findEntityIdByKindAndName(db, body.kindId, body.name);
  if (duplicated && duplicated.id !== id) {
    return fail(409, "entity already exists");
  }

  const normalizedTagIds = uniqTagIds(body.tagIds);
  const hasValidTags = await validateTagIds(db, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const updateResult = await updateEntity(db, {
    id,
    kindId: body.kindId,
    name: body.name,
    description: toDescription(body.description),
    isWishlistFlag: toWishlistFlag(body.isWishlist)
  });

  if (updateResult === "not_found") {
    return fail(404, "entity not found");
  }
  if (updateResult === "error") {
    return fail(500, "failed to update entity");
  }

  const tagsUpdated = await replaceEntityTags(db, id, normalizedTagIds);
  if (!tagsUpdated) {
    return fail(500, "failed to update entity tags");
  }

  const entity = await fetchEntityWithTags(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({
    entity: toEntityResponse(entity, kind)
  });
}
