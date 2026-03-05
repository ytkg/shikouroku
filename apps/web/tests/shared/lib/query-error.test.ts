import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import {
  applyResolvedQueryError,
  KEEP_CURRENT_ERROR,
  resolveQueryError,
  shouldKeepCurrentError
} from "@/shared/lib/query-error";

describe("resolveQueryError", () => {
  it("queryErrorがない場合はnullを返す", () => {
    const ensureAuthorized = vi.fn();

    const result = resolveQueryError({
      queryError: null,
      ensureAuthorized
    });

    expect(result).toBeNull();
    expect(ensureAuthorized).not.toHaveBeenCalled();
  });

  it("401で認証ガードがfalseの場合はKEEP_CURRENT_ERRORを返す", () => {
    const ensureAuthorized = vi.fn().mockReturnValue(false);

    const result = resolveQueryError({
      queryError: new ApiError(401, "unauthorized"),
      ensureAuthorized
    });

    expect(result).toBe(KEEP_CURRENT_ERROR);
    expect(ensureAuthorized).toHaveBeenCalledWith(401);
  });

  it("404かつnotFoundMessage指定時は指定文言を返す", () => {
    const ensureAuthorized = vi.fn().mockReturnValue(true);

    const result = resolveQueryError({
      queryError: new ApiError(404, "not found"),
      ensureAuthorized,
      notFoundMessage: "データが見つかりませんでした"
    });

    expect(result).toBe("データが見つかりませんでした");
  });

  it("その他はerror messageへ正規化する", () => {
    const ensureAuthorized = vi.fn().mockReturnValue(true);

    expect(
      resolveQueryError({
        queryError: new Error("failure"),
        ensureAuthorized
      })
    ).toBe("failure");

    expect(
      resolveQueryError({
        queryError: "bad",
        ensureAuthorized
      })
    ).toBe("unknown error");
  });

  it("shouldKeepCurrentErrorは認証ガード判定を共通化する", () => {
    const ensureAuthorized = vi.fn().mockReturnValue(false);
    expect(shouldKeepCurrentError(new ApiError(401, "unauthorized"), ensureAuthorized)).toBe(true);
    expect(ensureAuthorized).toHaveBeenCalledWith(401);
  });

  it("applyResolvedQueryErrorはKEEP_CURRENT_ERROR以外をsetErrorへ適用する", () => {
    const setError = vi.fn();
    const ensureAuthorized = vi.fn().mockReturnValue(true);

    applyResolvedQueryError(setError, {
      queryError: new Error("failure"),
      ensureAuthorized
    });
    expect(setError).toHaveBeenCalledWith("failure");
  });

  it("applyResolvedQueryErrorはKEEP_CURRENT_ERROR時にsetErrorしない", () => {
    const setError = vi.fn();
    const ensureAuthorized = vi.fn().mockReturnValue(false);

    applyResolvedQueryError(setError, {
      queryError: new ApiError(401, "unauthorized"),
      ensureAuthorized
    });
    expect(setError).not.toHaveBeenCalled();
  });
});
