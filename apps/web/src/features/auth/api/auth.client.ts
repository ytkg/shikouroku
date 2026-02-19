import { requestJson } from "@/shared/api/http.client";

export type LoginInput = {
  username: string;
  password: string;
};

type AuthResponse = {
  ok: boolean;
};

export async function login(input: LoginInput): Promise<void> {
  await requestJson<AuthResponse>("/api/login", {
    method: "POST",
    body: input
  });
}

export async function logout(): Promise<void> {
  await requestJson<AuthResponse>("/api/logout", {
    method: "POST"
  });
}
