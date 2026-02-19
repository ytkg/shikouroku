import { describe, expect, it } from "vitest";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";
import { parseAuthResponse } from "@/entities/auth/api/auth.response";

describe("auth.response", () => {
  it("ok=trueを許可する", () => {
    expect(() =>
      parseAuthResponse({
        ok: true
      })
    ).not.toThrow();
  });

  it("ok=true以外はApiError(INVALID_API_RESPONSE)をthrowする", () => {
    let thrown: unknown;

    try {
      parseAuthResponse({
        ok: false
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
