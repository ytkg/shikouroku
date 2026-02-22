import { createTagCommand } from "../modules/catalog/tag/application/create-tag-command";
import { deleteTagCommand } from "../modules/catalog/tag/application/delete-tag-command";
import { listTagsQuery } from "../modules/catalog/tag/application/list-tags-query";
import type { UseCaseResult } from "./result";

export async function listTagsUseCase(db: D1Database): Promise<UseCaseResult<{ tags: { id: number; name: string }[] }>> {
  return listTagsQuery(db);
}

export async function createTagUseCase(
  db: D1Database,
  name: string
): Promise<UseCaseResult<{ tag: { id: number; name: string } }>> {
  return createTagCommand(db, name);
}

export async function deleteTagUseCase(db: D1Database, id: number): Promise<UseCaseResult<Record<string, never>>> {
  return deleteTagCommand(db, id);
}
