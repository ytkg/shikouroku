import { loginAgainstAuthServer, verifyAuthToken } from "../lib/auth-client";
import { fail, success, type UseCaseResult } from "./result";

export async function loginUseCase(
  username: string,
  password: string
): Promise<UseCaseResult<{ token: string }>> {
  const token = await loginAgainstAuthServer(username, password);
  if (!token) {
    return fail(401, "Invalid credentials");
  }

  return success({ token });
}

export async function verifyTokenUseCase(token: string): Promise<boolean> {
  return verifyAuthToken(token);
}
