import { beforeEach, describe, expect, it, vi } from "vitest";

import { listEntityLocationsQuery } from "../../../../../../src/modules/catalog/entity/application/list-entity-locations-query";
import type { EntityApplicationRepository } from "../../../../../../src/modules/catalog/entity/ports/entity-application-repository";

const listEntityLocationsWithKindsMock = vi.fn();
const fetchTagsByEntityIdsMock = vi.fn();
const entityRepository: Pick<
  EntityApplicationRepository,
  "listEntityLocationsWithKinds" | "fetchTagsByEntityIds"
> = {
  listEntityLocationsWithKinds: listEntityLocationsWithKindsMock,
  fetchTagsByEntityIds: fetchTagsByEntityIdsMock
};

describe("listEntityLocationsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps rows to location DTO", async () => {
    listEntityLocationsWithKindsMock.mockResolvedValue([
      {
        id: "entity-1",
        kind_id: 1,
        kind_label: "場所",
        name: "東京駅",
        latitude: 35.681236,
        longitude: 139.767125
      }
    ] as any);
    fetchTagsByEntityIdsMock.mockResolvedValue(new Map([["entity-1", [{ id: 10, name: "散歩" }]]]));

    const result = await listEntityLocationsQuery(entityRepository);

    expect(result).toEqual({
      ok: true,
      data: {
        locations: [
          {
            id: "entity-1",
            kind: {
              id: 1,
              label: "場所"
            },
            name: "東京駅",
            tags: [{ id: 10, name: "散歩" }],
            location: {
              latitude: 35.681236,
              longitude: 139.767125
            }
          }
        ]
      }
    });
  });
});
