import { describe, expect, it, vi } from "vitest";
import { loginCommand } from "../../../../../src/modules/auth/application/login-command";
import { refreshTokenCommand } from "../../../../../src/modules/auth/application/refresh-token-command";
import { verifyTokenQuery } from "../../../../../src/modules/auth/application/verify-token-query";
import type { AuthGateway } from "../../../../../src/modules/auth/ports/auth-gateway";

describe("auth module application", () => {
  it("loginCommand returns unauthorized when gateway rejects credentials", async () => {
    const gateway: AuthGateway = {
      login: vi.fn().mockResolvedValue(null),
      refresh: vi.fn(),
      verify: vi.fn()
    };

    const result = await loginCommand(gateway, "alice", "wrong");

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Invalid credentials"
    });
  });

  it("refreshTokenCommand returns tokens when gateway accepts refresh token", async () => {
    const gateway: AuthGateway = {
      login: vi.fn(),
      refresh: vi.fn().mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh"
      }),
      verify: vi.fn()
    };

    const result = await refreshTokenCommand(gateway, "refresh");

    expect(result).toEqual({
      ok: true,
      data: {
        accessToken: "access",
        refreshToken: "refresh"
      }
    });
  });

  it("verifyTokenQuery delegates to gateway", async () => {
    const gateway: AuthGateway = {
      login: vi.fn(),
      refresh: vi.fn(),
      verify: vi.fn().mockResolvedValue(true)
    };

    const verified = await verifyTokenQuery(gateway, "token-1");

    expect(verified).toBe(true);
    expect(gateway.verify).toHaveBeenCalledWith("token-1");
  });
});
