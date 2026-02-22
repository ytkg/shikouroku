import { deleteTagWithRelationsFromD1 } from "../infra/tag-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";

export async function deleteTagCommand(
  db: D1Database,
  id: number
): Promise<UseCaseResult<Record<string, never>>> {
  const deleted = await deleteTagWithRelationsFromD1(db, id);
  if (deleted === "not_found") {
    return fail(404, "tag not found");
  }
  if (deleted === "error") {
    return fail(500, "failed to delete tag");
  }

  return success({});
}
