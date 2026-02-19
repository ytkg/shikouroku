import { listKinds } from "../repositories/kind-repository";
import { success, type UseCaseResult } from "./result";

export async function listKindsUseCase(db: D1Database): Promise<UseCaseResult<{ kinds: { id: number; label: string }[] }>> {
  const kinds = await listKinds(db);
  return success({ kinds });
}
