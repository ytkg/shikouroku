import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { loginBodySchema } from "../../shared/validation/request-schemas";
import { parseJsonBody } from "../../shared/http/parse-json-body";
import { loginCommand } from "../../modules/auth/application/login-command";
import { jsonOk } from "../../shared/http/api-response";
import { clearAuthCookies, setAuthCookies, useCaseError } from "./shared";

export function createAuthRoutes(): Hono<AppEnv> {
  const auth = new Hono<AppEnv>();

  auth.post("/login", async (c) => {
    const parsedBody = await parseJsonBody(c, loginBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const result = await loginCommand(c.env.AUTH_BASE_URL, parsedBody.data.username, parsedBody.data.password);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    const response = jsonOk(c, {});
    setAuthCookies(response, result.data.accessToken, result.data.refreshToken);
    return response;
  });

  auth.post("/logout", (c) => {
    const response = jsonOk(c, {});
    clearAuthCookies(response);
    return response;
  });

  return auth;
}
