import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { loginBodySchema } from "../../domain/schemas";
import { parseJsonBody } from "../../lib/http";
import { jsonOk } from "../../shared/http/api-response";
import { loginUseCase } from "../../usecases/auth-usecase";
import { clearAuthCookies, setAuthCookies, useCaseError } from "./shared";

export function createAuthRoutes(): Hono<AppEnv> {
  const auth = new Hono<AppEnv>();

  auth.post("/login", async (c) => {
    const parsedBody = await parseJsonBody(c, loginBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const result = await loginUseCase(c.env.AUTH_BASE_URL, parsedBody.data.username, parsedBody.data.password);
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
