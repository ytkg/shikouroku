import { describe, expect, it } from "vitest";
import { toErrorMessage } from "@/shared/lib/error-message";

describe("toErrorMessage", () => {
  it("Errorインスタンスからmessageを返す", () => {
    expect(toErrorMessage(new Error("failure"))).toBe("failure");
  });

  it("Error以外はunknown errorを返す", () => {
    expect(toErrorMessage("bad")).toBe("unknown error");
    expect(toErrorMessage(undefined)).toBe("unknown error");
    expect(toErrorMessage({ message: "x" })).toBe("unknown error");
  });
});
