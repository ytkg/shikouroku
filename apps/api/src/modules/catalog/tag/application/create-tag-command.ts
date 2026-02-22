import type { TagRepository } from "../ports/tag-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";

export async function createTagCommand(
  tagRepository: TagRepository,
  name: string
): Promise<UseCaseResult<{ tag: { id: number; name: string } }>> {
  const existing = await tagRepository.findTagByName(name);
  if (existing) {
    return fail(409, "tag already exists");
  }

  const insertedTag = await tagRepository.insertTag(name);
  if (!insertedTag) {
    return fail(500, "failed to insert tag");
  }

  return success({ tag: insertedTag });
}
