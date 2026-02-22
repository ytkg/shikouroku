import { verifyTokenWithAuthGateway } from "../infra/auth-gateway-http";

export async function verifyTokenQuery(authBaseUrl: string, token: string): Promise<boolean> {
  return verifyTokenWithAuthGateway(authBaseUrl, token);
}
