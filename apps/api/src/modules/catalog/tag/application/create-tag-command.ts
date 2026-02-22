import { findTagByNameFromD1, insertTagToD1 } from "../infra/tag-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";

export async function createTagCommand(
  db: D1Database,
  name: string
): Promise<UseCaseResult<{ tag: { id: number; name: string } }>> {
  const existing = await findTagByNameFromD1(db, name);
  if (existing) {
    return fail(409, "tag already exists");
  }

  const insertedTag = await insertTagToD1(db, name);
  if (!insertedTag) {
    return fail(500, "failed to insert tag");
  }

  return success({ tag: insertedTag });
}
