import type {
  EntityRecord,
  EntityWithKindAndFirstImageRecord,
  EntityWithKindRecord,
  EntityWithTagsRecord,
  TagRecord
} from "../domain/models";
import {
  deleteEntityInD1,
  fetchEntitiesWithKindsByIdsFromD1,
  fetchEntityWithTagsFromD1,
  fetchTagsByEntityIdsFromD1,
  findEntityByIdFromD1,
  findEntityIdByKindAndNameFromD1,
  findEntityWithKindByIdFromD1,
  insertEntityInD1,
  listEntitiesWithKindsFromD1,
  replaceEntityTagsInD1,
  updateEntityInD1,
  type InsertEntityInput,
  type UpdateEntityInput
} from "../modules/catalog/entity/infra/entity-repository-d1";

export async function listEntitiesWithKinds(db: D1Database): Promise<EntityWithKindAndFirstImageRecord[]> {
  return listEntitiesWithKindsFromD1(db);
}

export async function findEntityById(db: D1Database, id: string): Promise<EntityRecord | null> {
  return findEntityByIdFromD1(db, id);
}

export async function findEntityIdByKindAndName(
  db: D1Database,
  kindId: number,
  name: string
): Promise<{ id: string } | null> {
  return findEntityIdByKindAndNameFromD1(db, kindId, name);
}

export async function findEntityWithKindById(db: D1Database, id: string): Promise<EntityWithKindRecord | null> {
  return findEntityWithKindByIdFromD1(db, id);
}

export async function fetchEntitiesWithKindsByIds(
  db: D1Database,
  ids: string[]
): Promise<EntityWithKindRecord[]> {
  return fetchEntitiesWithKindsByIdsFromD1(db, ids);
}

export async function insertEntity(db: D1Database, input: InsertEntityInput): Promise<boolean> {
  return insertEntityInD1(db, input);
}

export async function updateEntity(
  db: D1Database,
  input: UpdateEntityInput
): Promise<"updated" | "not_found" | "error"> {
  return updateEntityInD1(db, input);
}

export async function deleteEntity(db: D1Database, id: string): Promise<void> {
  return deleteEntityInD1(db, id);
}

export async function replaceEntityTags(db: D1Database, entityId: string, tagIds: number[]): Promise<boolean> {
  return replaceEntityTagsInD1(db, entityId, tagIds);
}

export async function fetchTagsByEntityIds(db: D1Database, entityIds: string[]): Promise<Map<string, TagRecord[]>> {
  return fetchTagsByEntityIdsFromD1(db, entityIds);
}

export async function fetchEntityWithTags(db: D1Database, entityId: string): Promise<EntityWithTagsRecord | null> {
  return fetchEntityWithTagsFromD1(db, entityId);
}
