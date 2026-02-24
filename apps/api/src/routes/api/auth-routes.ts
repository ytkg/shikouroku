import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { loginBodySchema } from "../../shared/validation/request-schemas";
import { parseJsonBody } from "../../shared/http/parse-json-body";
import { loginCommand } from "../../modules/auth/application/login-command";
import { createHttpAuthGateway } from "../../modules/auth/infra/auth-gateway-http";
import { shouldUseSecureCookies } from "../../shared/http/auth-cookies";
import { jsonOk } from "../../shared/http/api-response";
import { clearAuthCookies, setAuthCookies, useCaseError } from "./shared";

export function createAuthRoutes(): Hono<AppEnv> {
  const auth = new Hono<AppEnv>();

  auth.get("/auth/me", (c) => {
    return jsonOk(c, { authenticated: true });
  });

  auth.post("/login", async (c) => {
    const parsedBody = await parseJsonBody(c, loginBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const authGateway = createHttpAuthGateway(c.env.AUTH_BASE_URL);
    const result = await loginCommand(authGateway, parsedBody.data.username, parsedBody.data.password);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    const response = jsonOk(c, {});
    const secure = shouldUseSecureCookies(c.req.raw);
    setAuthCookies(response, result.data.accessToken, result.data.refreshToken, secure);
    return response;
  });

  auth.post("/logout", (c) => {
    const response = jsonOk(c, {});
    const secure = shouldUseSecureCookies(c.req.raw);
    clearAuthCookies(response, secure);
    return response;
  });

  return auth;
}
