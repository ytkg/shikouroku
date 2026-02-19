import { afterEach, describe, expect, it, vi } from "vitest";
import { login, logout } from "@/entities/auth";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth.client", () => {
  it("login/logoutはok=trueレスポンスを受け付ける", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    await expect(login({ username: "alice", password: "secret" })).resolves.toBeUndefined();
    await expect(logout()).resolves.toBeUndefined();
  });

  it("ok=true以外はApiError(INVALID_API_RESPONSE)をthrowする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(login({ username: "alice", password: "secret" })).rejects.toMatchObject<ApiError>({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
