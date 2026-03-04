import type { Entity, EntityLocationPin } from "@/entities/entity";

type RegistrationCheckResult = {
  checkedEntities: Entity[];
  missingLocationEntities: Entity[];
  missingImageEntities: Entity[];
  missingTagEntities: Entity[];
  completeEntities: Entity[];
};

const LOCATION_KIND_LABEL = "場所";

export function buildRegistrationCheckResult(
  entities: Entity[],
  locations: EntityLocationPin[]
): RegistrationCheckResult {
  const checkedEntities = entities.filter((entity) => !entity.isWishlist);
  const locationEntityIds = new Set(locations.map((location) => location.id));
  const missingLocationEntities = checkedEntities.filter(
    (entity) => entity.kind.label === LOCATION_KIND_LABEL && !locationEntityIds.has(entity.id)
  );
  const missingImageEntities = checkedEntities.filter((entity) => !entity.firstImageUrl);
  const missingTagEntities = checkedEntities.filter((entity) => entity.tags.length === 0);
  const missingLocationEntityIdSet = new Set(missingLocationEntities.map((entity) => entity.id));
  const missingImageEntityIdSet = new Set(missingImageEntities.map((entity) => entity.id));
  const missingTagEntityIdSet = new Set(missingTagEntities.map((entity) => entity.id));
  const completeEntities = checkedEntities.filter(
    (entity) =>
      !missingLocationEntityIdSet.has(entity.id) &&
      !missingImageEntityIdSet.has(entity.id) &&
      !missingTagEntityIdSet.has(entity.id)
  );

  return {
    checkedEntities,
    missingLocationEntities,
    missingImageEntities,
    missingTagEntities,
    completeEntities
  };
}
