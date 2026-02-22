import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authGateway from "../../../../../src/modules/auth/infra/auth-gateway-http";
import { loginCommand } from "../../../../../src/modules/auth/application/login-command";
import { refreshTokenCommand } from "../../../../../src/modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../../../../../src/modules/auth/application/verify-token-query";

describe("auth module application", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loginCommand returns unauthorized when gateway rejects credentials", async () => {
    vi.spyOn(authGateway, "loginWithAuthGateway").mockResolvedValue(null);

    const result = await loginCommand("https://auth.example.test", "alice", "wrong");

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Invalid credentials"
    });
  });

  it("refreshTokenCommand returns tokens when gateway accepts refresh token", async () => {
    vi.spyOn(authGateway, "refreshWithAuthGateway").mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh"
    });

    const result = await refreshTokenCommand("https://auth.example.test", "refresh");

    expect(result).toEqual({
      ok: true,
      data: {
        accessToken: "access",
        refreshToken: "refresh"
      }
    });
  });

  it("verifyTokenQuery delegates to gateway", async () => {
    const verifySpy = vi.spyOn(authGateway, "verifyTokenWithAuthGateway").mockResolvedValue(true);

    const verified = await verifyTokenQuery("https://auth.example.test", "token-1");

    expect(verified).toBe(true);
    expect(verifySpy).toHaveBeenCalledWith("https://auth.example.test", "token-1");
  });
});
