import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loginAgainstAuthServer,
  refreshAgainstAuthServer,
  verifyAuthToken
} from "../../../src/lib/auth-client";

describe("auth-client", () => {
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

    const result = await loginAgainstAuthServer("https://auth.example.test/", "alice", "secret");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://auth.example.test/login",
      expect.objectContaining({
        method: "POST"
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

    const result = await refreshAgainstAuthServer("https://auth.example.test", "refresh-token");

    expect(result).toBeNull();
  });

  it("sets bearer token on verify request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const verified = await verifyAuthToken("https://auth.example.test", "token-123");

    expect(verified).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith("https://auth.example.test/verify", {
      headers: { Authorization: "Bearer token-123" }
    });
  });
});
