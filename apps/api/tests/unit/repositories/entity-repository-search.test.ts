import { describe, expect, it, vi } from "vitest";
import {
  countEntitiesWithKindsFromD1,
  listEntitiesWithKindsFromD1
} from "../../../src/modules/catalog/entity/infra/entity-repository-d1";

type MockDb = {
  db: D1Database;
  prepare: ReturnType<typeof vi.fn>;
  bind: ReturnType<typeof vi.fn>;
};

function createMockDb(): MockDb {
  const all = vi.fn(async () => ({ results: [] }));
  const first = vi.fn(async () => ({ total: 0 }));
  const bind = vi.fn(() => ({ all, first }));
  const prepare = vi.fn(() => ({ bind }));
  const db = { prepare } as unknown as D1Database;

  return { db, prepare, bind };
}

describe("entity repository search", () => {
  it("partial match uses INSTR instead of LIKE and keeps long query as bind value", async () => {
    const { db, prepare, bind } = createMockDb();
    const longQuery = "x".repeat(80);

    await listEntitiesWithKindsFromD1(db, {
      limit: 20,
      cursorCreatedAt: null,
      cursorId: null,
      kindId: null,
      wishlist: "include",
      q: longQuery,
      match: "partial",
      fields: ["title"]
    });

    const sql = prepare.mock.calls[0]?.[0] as string;
    expect(sql).toContain("INSTR(LOWER(e.name), LOWER(?)) > 0");
    expect(sql).not.toContain("LIKE ? COLLATE NOCASE");
    expect(bind).toHaveBeenCalledWith(longQuery, 20);
  });

  it("count query also avoids LIKE for prefix search", async () => {
    const { db, prepare, bind } = createMockDb();

    await countEntitiesWithKindsFromD1(db, {
      kindId: null,
      wishlist: "include",
      q: "prefix-check",
      match: "prefix",
      fields: ["body"]
    });

    const sql = prepare.mock.calls[0]?.[0] as string;
    expect(sql).toContain("INSTR(LOWER(COALESCE(e.description, '')), LOWER(?)) = 1");
    expect(sql).not.toContain("LIKE ? COLLATE NOCASE");
    expect(bind).toHaveBeenCalledWith("prefix-check");
  });
});
