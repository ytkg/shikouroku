import type { TagRepository } from "../ports/tag-repository";
import { success, type UseCaseResult } from "../../../../shared/application/result";

export async function listTagsQuery(
  tagRepository: TagRepository
): Promise<UseCaseResult<{ tags: { id: number; name: string }[] }>> {
  const tags = await tagRepository.listTags();
  return success({ tags });
}
