import { describe, expect, it } from "vitest";
import { httpStatus } from "@/shared/config/http-status";

describe("http-status", () => {
  it("HTTPステータス定数が期待値を持つ", () => {
    expect(httpStatus.unauthorized).toBe(401);
    expect(httpStatus.notFound).toBe(404);
    expect(httpStatus.badGateway).toBe(502);
  });
});
