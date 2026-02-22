import { listKindsQuery } from "../modules/catalog/kind/application/list-kinds-query";
import type { UseCaseResult } from "./result";

export async function listKindsUseCase(db: D1Database): Promise<UseCaseResult<{ kinds: { id: number; label: string }[] }>> {
  return listKindsQuery(db);
}
