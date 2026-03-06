import { useCallback, useEffect, useMemo, useState } from "react";
import type { EntityLocationPin } from "@/entities/entity";
import { useEntityImagesQuery, useEntityLocationsQuery, useEntityQuery } from "@/entities/entity";
import { useEntityMapFilter } from "../model/use-entity-map-filter";
import { useLeafletEntityMap } from "../model/use-leaflet-entity-map";
import { EntityMapCanvas } from "./entity-map-canvas";
import { EntityMapDetailModal } from "./entity-map-detail-modal";
import { EntityMapEmptyState } from "./entity-map-empty-state";
import { EntityMapFilterControls } from "./entity-map-filter-controls";
import { EntityMapLocationList } from "./entity-map-location-list";
import { EntityMapStatusSummary } from "./entity-map-status-summary";

export function EntityMapPageContent() {
  const { data: locations = [], error, isLoading } = useEntityLocationsQuery();
  const [selectedTagId, setSelectedTagId] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { data: selectedEntity, isLoading: isSelectedEntityLoading } = useEntityQuery(
    selectedEntityId ?? undefined
  );
  const { data: selectedEntityImages = [], isLoading: isSelectedEntityImagesLoading } = useEntityImagesQuery(
    selectedEntityId ?? undefined
  );

  const { filteredLocationEntities, locationEntities, selectedLocation, tagOptions, tagsByEntityId } = useMapPageData({
    locations,
    nameQuery,
    selectedEntityId,
    selectedTagId
  });

  const { focusEntityOnMap, mapContainerRef } = useLeafletEntityMap({
    filteredLocationEntities,
    onMarkerClick: setSelectedEntityId
  });
  const handleLocationListFocus = useCallback(
    (entityId: string) => {
      focusEntityOnMap(entityId);
    },
    [focusEntityOnMap]
  );
  const handleLocationListOpenDetail = useCallback(
    (entityId: string) => {
      setSelectedEntityId(entityId);
      focusEntityOnMap(entityId);
    },
    [focusEntityOnMap]
  );

  const handleTagClickInModal = useCallback((tagId: number) => {
    setSelectedTagId(String(tagId));
    setNameQuery("");
    setSelectedEntityId(null);
  }, []);

  useEffect(() => {
    if (!selectedEntityId) {
      return;
    }

    if (!filteredLocationEntities.some((location) => location.id === selectedEntityId)) {
      setSelectedEntityId(null);
    }
  }, [filteredLocationEntities, selectedEntityId]);

  const resetFilters = useCallback(() => {
    setSelectedTagId("all");
    setNameQuery("");
  }, []);

  return (
    <main className="mx-auto grid h-[calc(100dvh-env(safe-area-inset-bottom)-3rem)] w-full max-w-3xl box-border grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-3 overflow-hidden px-4 pb-0 pt-16">
      {error && <p className="text-sm text-destructive">地図データの取得に失敗しました。</p>}

      <EntityMapFilterControls
        selectedTagId={selectedTagId}
        nameQuery={nameQuery}
        tagOptions={tagOptions}
        onTagChange={setSelectedTagId}
        onNameQueryChange={setNameQuery}
      />

      <EntityMapStatusSummary
        totalCount={locationEntities.length}
        visibleCount={filteredLocationEntities.length}
        isLoading={isLoading}
        selectedEntityName={selectedEntity?.name ?? selectedLocation?.name ?? null}
      />

      <EntityMapCanvas isLoading={isLoading} mapContainerRef={mapContainerRef} />

      {filteredLocationEntities.length > 0 ? (
        <EntityMapLocationList
          entities={filteredLocationEntities}
          tagsByEntityId={tagsByEntityId}
          selectedEntityId={selectedEntityId}
          onFocus={handleLocationListFocus}
          onOpenDetail={handleLocationListOpenDetail}
        />
      ) : (
        <EntityMapEmptyState
          hasAnyLocation={locationEntities.length > 0}
          isLoading={isLoading}
          onResetFilters={resetFilters}
        />
      )}

      <EntityMapDetailModal
        selectedEntity={selectedEntity}
        selectedEntityImages={selectedEntityImages}
        selectedEntityId={selectedEntityId}
        selectedLocation={selectedLocation}
        isSelectedEntityLoading={isSelectedEntityLoading}
        isSelectedEntityImagesLoading={isSelectedEntityImagesLoading}
        onClose={() => setSelectedEntityId(null)}
        onTagClick={(tag) => handleTagClickInModal(tag.id)}
      />
    </main>
  );
}

type UseMapPageDataInput = {
  locations: EntityLocationPin[];
  selectedTagId: string;
  nameQuery: string;
  selectedEntityId: string | null;
};

function useMapPageData({ locations, selectedTagId, nameQuery, selectedEntityId }: UseMapPageDataInput) {
  const { filteredLocationEntities, locationEntities, tagOptions, tagsByEntityId } = useEntityMapFilter(
    locations,
    selectedTagId,
    nameQuery
  );

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedEntityId) ?? null,
    [locations, selectedEntityId]
  );

  return {
    filteredLocationEntities,
    locationEntities,
    selectedLocation,
    tagOptions,
    tagsByEntityId
  };
}
