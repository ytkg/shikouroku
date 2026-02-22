import { listTagsFromD1 } from "../infra/tag-repository-d1";
import { success, type UseCaseResult } from "../../../../shared/application/result";

export async function listTagsQuery(
  db: D1Database
): Promise<UseCaseResult<{ tags: { id: number; name: string }[] }>> {
  const tags = await listTagsFromD1(db);
  return success({ tags });
}
