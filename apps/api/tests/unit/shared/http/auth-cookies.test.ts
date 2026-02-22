import { describe, expect, it } from "vitest";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  makeAccessTokenCookie,
  makeRefreshTokenCookie
} from "../../../../src/shared/http/auth-cookies";

describe("auth-cookies", () => {
  it("extracts access and refresh token from Cookie header", () => {
    const request = new Request("https://example.test", {
      headers: {
        Cookie: "foo=bar; shikouroku_token=access-01; shikouroku_refresh_token=refresh-02"
      }
    });

    expect(getAccessTokenFromCookie(request)).toBe("access-01");
    expect(getRefreshTokenFromCookie(request)).toBe("refresh-02");
  });

  it("returns null when cookie header is missing", () => {
    const request = new Request("https://example.test");

    expect(getAccessTokenFromCookie(request)).toBeNull();
    expect(getRefreshTokenFromCookie(request)).toBeNull();
  });

  it("keeps '=' characters in cookie value", () => {
    const request = new Request("https://example.test", {
      headers: {
        Cookie: "shikouroku_token=part1=part2=part3"
      }
    });

    expect(getAccessTokenFromCookie(request)).toBe("part1=part2=part3");
  });

  it("builds auth cookies with expected flags", () => {
    expect(makeAccessTokenCookie("access-token")).toBe(
      "shikouroku_token=access-token; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=900"
    );
    expect(makeRefreshTokenCookie("refresh-token")).toBe(
      "shikouroku_refresh_token=refresh-token; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800"
    );
  });

  it("builds clear-cookie headers", () => {
    expect(clearAccessTokenCookie()).toBe(
      "shikouroku_token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"
    );
    expect(clearRefreshTokenCookie()).toBe(
      "shikouroku_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"
    );
  });
});
