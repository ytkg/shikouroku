import { describe, expect, it } from "vitest";
import { toFileSizeLabel } from "@/shared/lib/to-file-size-label";

describe("toFileSizeLabel", () => {
  it("1MB以上は小数1桁のMB表記を返す", () => {
    expect(toFileSizeLabel(1024 * 1024)).toBe("1.0 MB");
    expect(toFileSizeLabel(1572864)).toBe("1.5 MB");
  });

  it("1KB以上は四捨五入したKB表記を返す", () => {
    expect(toFileSizeLabel(1024)).toBe("1 KB");
    expect(toFileSizeLabel(1536)).toBe("2 KB");
  });

  it("1KB未満はB表記を返す", () => {
    expect(toFileSizeLabel(0)).toBe("0 B");
    expect(toFileSizeLabel(999)).toBe("999 B");
  });
});
