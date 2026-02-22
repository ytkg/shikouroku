import type { TagRepository } from "../ports/tag-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";

export async function deleteTagCommand(
  tagRepository: TagRepository,
  id: number
): Promise<UseCaseResult<Record<string, never>>> {
  const deleted = await tagRepository.deleteTagWithRelations(id);
  if (deleted === "not_found") {
    return fail(404, "tag not found");
  }
  if (deleted === "error") {
    return fail(500, "failed to delete tag");
  }

  return success({});
}
