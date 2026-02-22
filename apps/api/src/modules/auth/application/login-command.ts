import type { AuthGateway, AuthTokenPair } from "../ports/auth-gateway";
import { fail, success, type UseCaseResult } from "../../../shared/application/result";

export async function loginCommand(
  authGateway: AuthGateway,
  username: string,
  password: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await authGateway.login(username, password);
  if (!tokens) {
    return fail(401, "Invalid credentials");
  }

  return success(tokens);
}
