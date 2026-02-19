import type { EntityBody } from "../domain/schemas";
import type { EntityWithTagsRow } from "../domain/models";
import { existsKind } from "../repositories/kind-repository";
import {
  deleteEntity,
  fetchEntityWithTags,
  fetchTagsByEntityIds,
  findEntityById,
  insertEntity,
  listEntities,
  replaceEntityTags,
  updateEntity
} from "../repositories/entity-repository";
import { countExistingTagsByIds } from "../repositories/tag-repository";
import { fail, success, type UseCaseResult } from "./result";

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

export async function listEntitiesUseCase(
  db: D1Database
): Promise<UseCaseResult<{ entities: EntityWithTagsRow[] }>> {
  const entities = await listEntities(db);
  const tagsByEntity = await fetchTagsByEntityIds(
    db,
    entities.map((entity) => entity.id)
  );

  return success({
    entities: entities.map((entity) => ({
      ...entity,
      tags: tagsByEntity.get(entity.id) ?? []
    }))
  });
}

export async function getEntityUseCase(
  db: D1Database,
  id: string
): Promise<UseCaseResult<{ entity: EntityWithTagsRow }>> {
  const entity = await fetchEntityWithTags(db, id);
  if (!entity) {
    return fail(404, "entity not found");
  }

  return success({ entity });
}

export async function createEntityUseCase(
  db: D1Database,
  body: EntityBody
): Promise<UseCaseResult<{ entity: EntityWithTagsRow }>> {
  const normalizedTagIds = uniqTagIds(body.tagIds);

  const kindExists = await existsKind(db, body.kindId);
  if (!kindExists) {
    return fail(400, "kind not found");
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

  return success({ entity });
}

export async function updateEntityUseCase(
  db: D1Database,
  id: string,
  body: EntityBody
): Promise<UseCaseResult<{ entity: EntityWithTagsRow }>> {
  const existing = await findEntityById(db, id);
  if (!existing) {
    return fail(404, "entity not found");
  }

  const kindExists = await existsKind(db, body.kindId);
  if (!kindExists) {
    return fail(400, "kind not found");
  }

  const normalizedTagIds = uniqTagIds(body.tagIds);
  const hasValidTags = await validateTagIds(db, normalizedTagIds);
  if (!hasValidTags) {
    return fail(400, "tag not found");
  }

  const updated = await updateEntity(db, {
    id,
    kindId: body.kindId,
    name: body.name,
    description: toDescription(body.description),
    isWishlistFlag: toWishlistFlag(body.isWishlist)
  });

  if (!updated) {
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

  return success({ entity });
}
