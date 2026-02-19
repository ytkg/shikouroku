import { parseAuthResponse } from "@/features/auth/api/auth.response";
import { requestJson } from "@/shared/api/http.client";
import { apiPaths } from "@/shared/config/api-paths";

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
