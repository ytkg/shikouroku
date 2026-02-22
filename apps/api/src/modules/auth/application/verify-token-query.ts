import type { AuthGateway } from "../ports/auth-gateway";

export async function verifyTokenQuery(authGateway: AuthGateway, token: string): Promise<boolean> {
  return authGateway.verify(token);
}
