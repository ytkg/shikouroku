import useSWR from "swr";
import {
  fetchEntities,
  fetchEntityById,
  fetchEntityLocations,
  fetchKinds,
  fetchTags
} from "../api/entities.client";
import { fetchEntityImages } from "../api/images.client";
import { fetchRelatedEntities } from "../api/related.client";
import {
  ENTITIES_KEY,
  ENTITY_LOCATIONS_KEY,
  entityKey,
  entityImagesKey,
  KINDS_KEY,
  relatedEntitiesKey,
  TAGS_KEY
} from "./entity.swr-keys";

export function useEntitiesQuery() {
  return useSWR(ENTITIES_KEY, fetchEntities);
}

export function useEntityLocationsQuery() {
  return useSWR(ENTITY_LOCATIONS_KEY, fetchEntityLocations);
}

export function useEntityQuery(entityId: string | undefined) {
  return useSWR(entityId ? entityKey(entityId) : null, () => fetchEntityById(entityId ?? ""));
}

export function useRelatedEntitiesQuery(entityId: string | undefined) {
  return useSWR(entityId ? relatedEntitiesKey(entityId) : null, () =>
    fetchRelatedEntities(entityId ?? "")
  );
}

export function useEntityImagesQuery(entityId: string | undefined) {
  return useSWR(entityId ? entityImagesKey(entityId) : null, () =>
    fetchEntityImages(entityId ?? "")
  );
}

export function useKindsQuery() {
  return useSWR(KINDS_KEY, fetchKinds);
}

export function useTagsQuery() {
  return useSWR(TAGS_KEY, fetchTags);
}
