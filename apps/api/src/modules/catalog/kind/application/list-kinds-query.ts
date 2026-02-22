import { listKindsFromD1 } from "../infra/kind-repository-d1";
import { success, type UseCaseResult } from "../../../../shared/application/result";

export async function listKindsQuery(
  db: D1Database
): Promise<UseCaseResult<{ kinds: { id: number; label: string }[] }>> {
  const kinds = await listKindsFromD1(db);
  return success({ kinds });
}
