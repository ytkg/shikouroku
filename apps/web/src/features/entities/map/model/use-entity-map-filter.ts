import { useMemo } from "react";
import type { EntityLocationMapData, LocationTagLookup, MapLocationEntity, MapTagOption } from "../ui/entity-map-types";

function buildTagOptions(locations: EntityLocationMapData[]): MapTagOption[] {
  return Array.from(
    new Map(
      locations
        .flatMap((entity) => entity.tags)
        .map((tag) => [tag.id, tag.name])
    ).entries()
  )
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

function toLocationEntity(entity: EntityLocationMapData): MapLocationEntity {
  return {
    id: entity.id,
    name: entity.name,
    latitude: entity.location.latitude,
    longitude: entity.location.longitude
  };
}

export function useEntityMapFilter(locations: EntityLocationMapData[], selectedTagId: string, nameQuery: string) {
  const tagOptions = useMemo(() => buildTagOptions(locations), [locations]);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = nameQuery.trim().toLocaleLowerCase();
    return locations.filter((entity) => {
      if (selectedTagId !== "all" && !entity.tags.some((tag) => String(tag.id) === selectedTagId)) {
        return false;
      }
      if (normalizedQuery.length > 0 && !entity.name.toLocaleLowerCase().includes(normalizedQuery)) {
        return false;
      }
      return true;
    });
  }, [locations, nameQuery, selectedTagId]);

  const locationEntities = useMemo<MapLocationEntity[]>(() => locations.map(toLocationEntity), [locations]);
  const filteredLocationEntities = useMemo<MapLocationEntity[]>(
    () => filteredLocations.map(toLocationEntity),
    [filteredLocations]
  );

  const tagsByEntityId = useMemo<LocationTagLookup>(() => {
    return new Map(locations.map((location) => [location.id, location.tags]));
  }, [locations]);

  return {
    filteredLocations,
    filteredLocationEntities,
    locationEntities,
    tagOptions,
    tagsByEntityId
  };
}
