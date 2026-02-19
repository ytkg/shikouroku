import {
  deleteTagAndRelations,
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

  const insertedTag = await insertTag(db, name);
  if (!insertedTag) {
    return fail(500, "failed to insert tag");
  }

  return success({ tag: insertedTag });
}

export async function deleteTagUseCase(db: D1Database, id: number): Promise<UseCaseResult<Record<string, never>>> {
  const deleted = await deleteTagAndRelations(db, id);
  if (deleted === "not_found") {
    return fail(404, "tag not found");
  }
  if (deleted === "error") {
    return fail(500, "failed to delete tag");
  }

  return success({});
}
