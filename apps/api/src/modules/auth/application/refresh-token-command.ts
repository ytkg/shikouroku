import type { AuthGateway, AuthTokenPair } from "../ports/auth-gateway";
import { fail, success, type UseCaseResult } from "../../../shared/application/result";

export async function refreshTokenCommand(
  authGateway: AuthGateway,
  refreshToken: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await authGateway.refresh(refreshToken);
  if (!tokens) {
    return fail(401, "Invalid refresh token");
  }

  return success(tokens);
}
