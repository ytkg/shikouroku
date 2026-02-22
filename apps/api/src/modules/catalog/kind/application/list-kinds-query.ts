import type { KindRepository } from "../ports/kind-repository";
import { success, type UseCaseResult } from "../../../../shared/application/result";

export async function listKindsQuery(
  kindRepository: KindRepository
): Promise<UseCaseResult<{ kinds: { id: number; label: string }[] }>> {
  const kinds = await kindRepository.listKinds();
  return success({ kinds });
}
