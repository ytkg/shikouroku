import useSWR from "swr";
import {
  fetchEntities,
  fetchEntityById,
  fetchKinds,
  fetchTags
} from "../api/entities.client";
import { fetchRelatedEntities } from "../api/related.client";
import {
  ENTITIES_KEY,
  entityKey,
  KINDS_KEY,
  relatedEntitiesKey,
  TAGS_KEY
} from "./entity.swr-keys";

export function useEntitiesQuery() {
  return useSWR(ENTITIES_KEY, fetchEntities);
}

export function useEntityQuery(entityId: string | undefined) {
  return useSWR(entityId ? entityKey(entityId) : null, () => fetchEntityById(entityId ?? ""));
}

export function useRelatedEntitiesQuery(entityId: string | undefined) {
  return useSWR(entityId ? relatedEntitiesKey(entityId) : null, () =>
    fetchRelatedEntities(entityId ?? "")
  );
}

export function useKindsQuery() {
  return useSWR(KINDS_KEY, fetchKinds);
}

export function useTagsQuery() {
  return useSWR(TAGS_KEY, fetchTags);
}
