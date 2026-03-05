import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_GATEWAY_TIMEOUT_MS,
  loginWithAuthGateway,
  refreshWithAuthGateway,
  verifyTokenWithAuthGateway
} from "../../../../../src/modules/auth/infra/auth-gateway-http";

describe("auth-gateway-http", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses configured auth base URL for login request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "access-token", refreshToken: "refresh-token" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await loginWithAuthGateway("https://auth.example.test/", "alice", "secret");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://auth.example.test/login",
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal)
      })
    );
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
  });

  it("returns null when auth response body shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "only-access-token" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await refreshWithAuthGateway("https://auth.example.test", "refresh-token");

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "[auth-gateway]",
      expect.objectContaining({ operation: "refresh", reason: "invalid_response_shape" })
    );
  });

  it("sets bearer token on verify request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    const verified = await verifyTokenWithAuthGateway("https://auth.example.test", "token-123");

    expect(verified).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://auth.example.test/verify",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-123" },
        signal: expect.any(AbortSignal)
      })
    );
  });

  it("returns null and logs network error when login request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await loginWithAuthGateway("https://auth.example.test", "alice", "secret");

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "[auth-gateway]",
      expect.objectContaining({ operation: "login", reason: "network_error" })
    );
  });

  it("returns null and logs upstream error on refresh 503", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await refreshWithAuthGateway("https://auth.example.test", "refresh-token");

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "[auth-gateway]",
      expect.objectContaining({ operation: "refresh", reason: "upstream_error", status: 503 })
    );
  });

  it("returns false and logs timeout on verify abort", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("aborted", "AbortError"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const verified = await verifyTokenWithAuthGateway("https://auth.example.test", "token-123");

    expect(verified).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "[auth-gateway]",
      expect.objectContaining({
        operation: "verify",
        reason: "timeout",
        timeoutMs: AUTH_GATEWAY_TIMEOUT_MS
      })
    );
  });
});
