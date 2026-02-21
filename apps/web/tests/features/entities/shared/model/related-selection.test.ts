import { describe, expect, it } from "vitest";
import {
  addRelatedEntityId,
  diffRelatedEntityIds,
  removeRelatedEntityId,
  toggleRelatedEntityId
} from "@/features/entities/shared/model/related-selection";

describe("related-selection", () => {
  it("addRelatedEntityId は重複追加しない", () => {
    expect(addRelatedEntityId(["a", "b"], "b")).toEqual(["a", "b"]);
    expect(addRelatedEntityId(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("removeRelatedEntityId は対象IDのみ削除する", () => {
    expect(removeRelatedEntityId(["a", "b", "c"], "b")).toEqual(["a", "c"]);
    expect(removeRelatedEntityId(["a", "b", "c"], "z")).toEqual(["a", "b", "c"]);
  });

  it("toggleRelatedEntityId は checked に応じて add/remove する", () => {
    expect(toggleRelatedEntityId(["a"], "b", true)).toEqual(["a", "b"]);
    expect(toggleRelatedEntityId(["a", "b"], "b", false)).toEqual(["a"]);
  });

  it("diffRelatedEntityIds は追加と削除の差分を返す", () => {
    expect(diffRelatedEntityIds(["a", "c"], ["a", "b"])).toEqual({
      toAdd: ["b"],
      toRemove: ["c"]
    });
  });
});
