export async function requestEntityMutation(
  requestJsonAction: () => Promise<unknown>,
  parseMutationResponse: (json: unknown) => void
): Promise<void> {
  const json = await requestJsonAction();
  parseMutationResponse(json);
}
