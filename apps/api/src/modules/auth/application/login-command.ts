import { loginWithAuthGateway, type AuthTokenPair } from "../infra/auth-gateway-http";
import { fail, success, type UseCaseResult } from "../../../shared/application/result";

export async function loginCommand(
  authBaseUrl: string,
  username: string,
  password: string
): Promise<UseCaseResult<AuthTokenPair>> {
  const tokens = await loginWithAuthGateway(authBaseUrl, username, password);
  if (!tokens) {
    return fail(401, "Invalid credentials");
  }

  return success(tokens);
}
