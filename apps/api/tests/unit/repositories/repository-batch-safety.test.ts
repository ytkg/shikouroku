import { describe, expect, it, vi } from "vitest";
import { reorderEntityImages } from "../../../src/repositories/entity-image-repository";
import { replaceEntityTags } from "../../../src/repositories/entity-repository";
import { deleteTagAndRelations } from "../../../src/repositories/tag-repository";

type MockResult = {
  success: boolean;
  meta: {
    changes?: number;
  };
};

function createMockDb(batchResults: MockResult[]) {
  const prepare = vi.fn((sql: string) => ({
    bind: (...args: unknown[]) =>
      ({
        sql,
        args
      }) as unknown as D1PreparedStatement
  }));

  const batch = vi.fn(async () => batchResults as unknown as D1Result[]);

  return {
    db: {
      prepare,
      batch
    } as unknown as D1Database,
    prepare,
    batch
  };
}

describe("repository batch safety", () => {
  it("replaceEntityTags executes delete and inserts in a single batch", async () => {
    const { db, batch } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: {} },
      { success: true, meta: {} }
    ]);

    const result = await replaceEntityTags(db, "entity-1", [1, 2]);

    expect(result).toBe(true);
    expect(batch).toHaveBeenCalledTimes(1);
    expect((batch.mock.calls[0]?.[0] as unknown[]).length).toBe(3);
  });

  it("replaceEntityTags returns false when batch contains failure", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: false, meta: {} }
    ]);

    const result = await replaceEntityTags(db, "entity-1", [10]);

    expect(result).toBe(false);
  });

  it("reorderEntityImages executes negation and updates in one batch", async () => {
    const { db, batch } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: {} },
      { success: true, meta: {} }
    ]);

    const result = await reorderEntityImages(db, "entity-1", ["img-1", "img-2"]);

    expect(result).toBe(true);
    expect(batch).toHaveBeenCalledTimes(1);
    expect((batch.mock.calls[0]?.[0] as unknown[]).length).toBe(3);
  });

  it("reorderEntityImages returns false when any statement fails", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: false, meta: {} }
    ]);

    const result = await reorderEntityImages(db, "entity-1", ["img-1"]);

    expect(result).toBe(false);
  });

  it("deleteTagAndRelations returns deleted when tag row is removed", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: { changes: 1 } }
    ]);

    const result = await deleteTagAndRelations(db, 10);

    expect(result).toBe("deleted");
  });

  it("deleteTagAndRelations returns not_found when tag row does not exist", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: { changes: 0 } }
    ]);

    const result = await deleteTagAndRelations(db, 999);

    expect(result).toBe("not_found");
  });

  it("deleteTagAndRelations returns error when batch fails", async () => {
    const { db } = createMockDb([
      { success: false, meta: {} },
      { success: true, meta: { changes: 1 } }
    ]);

    const result = await deleteTagAndRelations(db, 1);

    expect(result).toBe("error");
  });
});
