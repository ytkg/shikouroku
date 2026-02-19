import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

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
});
