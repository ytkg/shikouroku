import { requestJson } from "@/shared/api/http.client";
import { apiPaths } from "@/shared/config/api-paths";

export type LoginInput = {
  username: string;
  password: string;
};

type AuthResponse = {
  ok: boolean;
};

export async function login(input: LoginInput): Promise<void> {
  await requestJson<AuthResponse>(apiPaths.login, {
    method: "POST",
    body: input
  });
}

export async function logout(): Promise<void> {
  await requestJson<AuthResponse>(apiPaths.logout, {
    method: "POST"
  });
}
