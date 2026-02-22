import { describe, expect, it, vi } from "vitest";
import { listKindsQuery } from "../../../../../../src/modules/catalog/kind/application/list-kinds-query";
import type { KindRepository } from "../../../../../../src/modules/catalog/kind/ports/kind-repository";

describe("kind module application", () => {
  it("listKindsQuery returns kinds from repository", async () => {
    const repository: KindRepository = {
      listKinds: vi.fn().mockResolvedValue([
        { id: 1, label: "Book" },
        { id: 2, label: "Movie" }
      ]),
      findKindById: vi.fn()
    };

    const result = await listKindsQuery(repository);

    expect(result).toEqual({
      ok: true,
      data: {
        kinds: [
          { id: 1, label: "Book" },
          { id: 2, label: "Movie" }
        ]
      }
    });
  });
});
