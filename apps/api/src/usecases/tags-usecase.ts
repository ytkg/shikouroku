import {
  deleteTagAndRelations,
  findTagById,
  findTagByName,
  insertTag,
  listTags
} from "../repositories/tag-repository";
import { fail, success, type UseCaseResult } from "./result";

export async function listTagsUseCase(db: D1Database): Promise<UseCaseResult<{ tags: { id: number; name: string }[] }>> {
  const tags = await listTags(db);
  return success({ tags });
}

export async function createTagUseCase(
  db: D1Database,
  name: string
): Promise<UseCaseResult<{ tag: { id: number; name: string } }>> {
  const existing = await findTagByName(db, name);
  if (existing) {
    return fail(409, "tag already exists");
  }

  const inserted = await insertTag(db, name);
  if (!inserted) {
    return fail(500, "failed to insert tag");
  }

  const tag = await findTagByName(db, name);
  if (!tag) {
    return fail(500, "failed to load tag");
  }

  return success({ tag });
}

export async function deleteTagUseCase(db: D1Database, id: number): Promise<UseCaseResult<Record<string, never>>> {
  const existing = await findTagById(db, id);
  if (!existing) {
    return fail(404, "tag not found");
  }

  const deleted = await deleteTagAndRelations(db, id);
  if (!deleted) {
    return fail(500, "failed to delete tag");
  }

  return success({});
}
