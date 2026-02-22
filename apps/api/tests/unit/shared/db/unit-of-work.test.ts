import { describe, expect, it, vi } from "vitest";
import { isSuccessfulD1UnitOfWork, runD1UnitOfWork } from "../../../../src/shared/db/unit-of-work";

function createPreparedStatement(): D1PreparedStatement {
  return {
    bind: vi.fn(() => createPreparedStatement())
  } as unknown as D1PreparedStatement;
}

describe("d1 unit of work", () => {
  it("returns batch results when execution succeeds", async () => {
    const results = [
      { success: true, meta: {} },
      { success: true, meta: { changes: 1 } }
    ] as unknown as D1Result[];
    const db = {
      batch: vi.fn(async () => results)
    } as unknown as D1Database;

    const actual = await runD1UnitOfWork(db, [createPreparedStatement()]);

    expect(actual).toEqual(results);
  });

  it("returns null when batch throws", async () => {
    const db = {
      batch: vi.fn(async () => {
        throw new Error("batch failed");
      })
    } as unknown as D1Database;

    const actual = await runD1UnitOfWork(db, [createPreparedStatement()]);

    expect(actual).toBeNull();
  });

  it("returns empty result for empty statements", async () => {
    const db = {
      batch: vi.fn(async () => [])
    } as unknown as D1Database;

    const actual = await runD1UnitOfWork(db, []);

    expect(actual).toEqual([]);
    expect((db.batch as any).mock.calls).toHaveLength(0);
  });

  it("judges success only when all results are successful", () => {
    expect(
      isSuccessfulD1UnitOfWork([
        { success: true },
        { success: true }
      ] as unknown as D1Result[])
    ).toBe(true);

    expect(
      isSuccessfulD1UnitOfWork([
        { success: true },
        { success: false }
      ] as unknown as D1Result[])
    ).toBe(false);
  });
});
