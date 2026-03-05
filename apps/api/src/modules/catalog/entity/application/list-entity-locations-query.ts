import { success, type UseCaseResult } from "../../../../shared/application/result";
import type { EntityApplicationRepository } from "../ports/entity-application-repository";

type EntityLocationDto = {
  id: string;
  kind: {
    id: number;
    label: string;
  };
  name: string;
  tags: {
    id: number;
    name: string;
  }[];
  location: {
    latitude: number;
    longitude: number;
  };
};

export async function listEntityLocationsQuery(
  entityRepository: Pick<EntityApplicationRepository, "listEntityLocationsWithKinds" | "fetchTagsByEntityIds">
): Promise<UseCaseResult<{ locations: EntityLocationDto[] }>> {
  const rows = await entityRepository.listEntityLocationsWithKinds();
  const tagsByEntity = await entityRepository.fetchTagsByEntityIds(rows.map((row) => row.id));
  return success({
    locations: rows.map((row) => ({
      id: row.id,
      kind: {
        id: row.kind_id,
        label: row.kind_label
      },
      name: row.name,
      tags: tagsByEntity.get(row.id) ?? [],
      location: {
        latitude: row.latitude,
        longitude: row.longitude
      }
    }))
  });
}
