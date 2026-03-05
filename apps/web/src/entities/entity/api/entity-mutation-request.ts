import { requestJson, type JsonRequestInit } from "@/shared/api/http.client";

export async function requestEntityMutation(
  path: string,
  init: JsonRequestInit,
  parseMutationResponse: (json: unknown) => void
): Promise<void> {
  const json = await requestJson<unknown>(path, init);
  parseMutationResponse(json);
}
