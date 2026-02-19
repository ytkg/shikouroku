import { describe, expect, it } from "vitest";
import {
  addTagId,
  removeTagId,
  toggleTagId
} from "@/features/entities/shared/model/tag-selection";

describe("tag-selection", () => {
  it("addTagId は重複追加しない", () => {
    expect(addTagId([1, 2], 2)).toEqual([1, 2]);
    expect(addTagId([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it("removeTagId は対象IDのみ削除する", () => {
    expect(removeTagId([1, 2, 3], 2)).toEqual([1, 3]);
    expect(removeTagId([1, 2, 3], 9)).toEqual([1, 2, 3]);
  });

  it("toggleTagId は checked に応じて add/remove する", () => {
    expect(toggleTagId([1], 2, true)).toEqual([1, 2]);
    expect(toggleTagId([1, 2], 2, false)).toEqual([1]);
  });
});
