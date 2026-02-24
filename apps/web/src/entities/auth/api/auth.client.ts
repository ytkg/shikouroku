import { parseAuthResponse } from "./auth.response";
import { ApiError } from "@/shared/api/api-error";
import { requestJson } from "@/shared/api/http.client";
import { apiPaths } from "@/shared/config/api-paths";
import { httpStatus } from "@/shared/config/http-status";

export type LoginInput = {
  username: string;
  password: string;
};

export async function login(input: LoginInput): Promise<void> {
  const json = await requestJson<unknown>(apiPaths.login, {
    method: "POST",
    body: input
  });
  parseAuthResponse(json);
}

export async function logout(): Promise<void> {
  const json = await requestJson<unknown>(apiPaths.logout, {
    method: "POST"
  });
  parseAuthResponse(json);
}

export async function checkAuthenticated(): Promise<boolean> {
  try {
    await requestJson<unknown>(apiPaths.authMe);
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === httpStatus.unauthorized) {
      return false;
    }
    throw e;
  }
}
