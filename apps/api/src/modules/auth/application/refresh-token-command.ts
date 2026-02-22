import { refreshWithAuthGateway, type AuthTokenPair } from "../infra/auth-gateway-http";
import { fail, success, type UseCaseResult } from "../../../shared/application/result";

export async function refreshTokenCommand(
  authBaseUrl: string,
  refreshToken: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await refreshWithAuthGateway(authBaseUrl, refreshToken);
  if (!tokens) {
    return fail(401, "Invalid refresh token");
  }

  return success(tokens);
}
