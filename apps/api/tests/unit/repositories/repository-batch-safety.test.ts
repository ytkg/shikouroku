import { describe, expect, it, vi } from "vitest";
import {
  insertEntityWithTagsInD1,
  replaceEntityTagsInD1,
  updateEntityWithTagsInD1
} from "../../../src/modules/catalog/entity/infra/entity-repository-d1";
import { reorderEntityImagesInD1 } from "../../../src/modules/catalog/image/infra/image-repository-d1";
import { deleteTagWithRelationsFromD1 } from "../../../src/modules/catalog/tag/infra/tag-repository-d1";

type MockResult = {
  success: boolean;
  meta: {
    changes?: number;
  };
};

function createMockDb(batchResults: MockResult[], firstResult: unknown = { id: "entity-1" }) {
  const prepare = vi.fn((sql: string) => ({
    bind: (...args: unknown[]) =>
      ({
        sql,
        args,
        first: async () => firstResult
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
  it("insertEntityWithTagsInD1 executes entity and tag inserts in a single batch", async () => {
    const { db, batch } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: {} },
      { success: true, meta: {} }
    ]);

    const result = await insertEntityWithTagsInD1(
      db,
      {
        id: "entity-1",
        kindId: 1,
        name: "DDD",
        description: null,
        isWishlistFlag: 0
      },
      [10, 11]
    );

    expect(result).toBe(true);
    expect(batch).toHaveBeenCalledTimes(1);
    expect((batch.mock.calls[0]?.[0] as unknown[]).length).toBe(3);
  });

  it("updateEntityWithTagsInD1 executes update and tag replacement in a single batch", async () => {
    const { db, batch } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: {} },
      { success: true, meta: {} }
    ]);

    const result = await updateEntityWithTagsInD1(
      db,
      {
        id: "entity-1",
        kindId: 1,
        name: "DDD",
        description: null,
        isWishlistFlag: 0
      },
      [10]
    );

    expect(result).toBe("updated");
    expect(batch).toHaveBeenCalledTimes(1);
    expect((batch.mock.calls[0]?.[0] as unknown[]).length).toBe(3);
  });

  it("updateEntityWithTagsInD1 returns not_found without batch when entity is missing", async () => {
    const { db, batch } = createMockDb([{ success: true, meta: {} }], null);

    const result = await updateEntityWithTagsInD1(
      db,
      {
        id: "entity-missing",
        kindId: 1,
        name: "DDD",
        description: null,
        isWishlistFlag: 0
      },
      [10]
    );

    expect(result).toBe("not_found");
    expect(batch).not.toHaveBeenCalled();
  });

  it("replaceEntityTags executes delete and inserts in a single batch", async () => {
    const { db, batch } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: {} },
      { success: true, meta: {} }
    ]);

    const result = await replaceEntityTagsInD1(db, "entity-1", [1, 2]);

    expect(result).toBe(true);
    expect(batch).toHaveBeenCalledTimes(1);
    expect((batch.mock.calls[0]?.[0] as unknown[]).length).toBe(3);
  });

  it("replaceEntityTags returns false when batch contains failure", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: false, meta: {} }
    ]);

    const result = await replaceEntityTagsInD1(db, "entity-1", [10]);

    expect(result).toBe(false);
  });

  it("reorderEntityImagesInD1 executes negation and updates in one batch", async () => {
    const { db, batch } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: {} },
      { success: true, meta: {} }
    ]);

    const result = await reorderEntityImagesInD1(db, "entity-1", ["img-1", "img-2"]);

    expect(result).toBe(true);
    expect(batch).toHaveBeenCalledTimes(1);
    expect((batch.mock.calls[0]?.[0] as unknown[]).length).toBe(3);
  });

  it("reorderEntityImagesInD1 returns false when any statement fails", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: false, meta: {} }
    ]);

    const result = await reorderEntityImagesInD1(db, "entity-1", ["img-1"]);

    expect(result).toBe(false);
  });

  it("deleteTagWithRelationsFromD1 returns deleted when tag row is removed", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: { changes: 1 } }
    ]);

    const result = await deleteTagWithRelationsFromD1(db, 10);

    expect(result).toBe("deleted");
  });

  it("deleteTagWithRelationsFromD1 returns not_found when tag row does not exist", async () => {
    const { db } = createMockDb([
      { success: true, meta: {} },
      { success: true, meta: { changes: 0 } }
    ]);

    const result = await deleteTagWithRelationsFromD1(db, 999);

    expect(result).toBe("not_found");
  });

  it("deleteTagWithRelationsFromD1 returns error when batch fails", async () => {
    const { db } = createMockDb([
      { success: false, meta: {} },
      { success: true, meta: { changes: 1 } }
    ]);

    const result = await deleteTagWithRelationsFromD1(db, 1);

    expect(result).toBe("error");
  });
});
