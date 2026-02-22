import { useCallback } from "react";
import { useSWRConfig } from "swr";
import {
  createEntity as createEntityRequest,
  updateEntity as updateEntityRequest,
  type CreateEntityInput,
  type UpdateEntityInput
} from "../api/entities.client";
import {
  deleteEntityImage as deleteEntityImageRequest,
  reorderEntityImages as reorderEntityImagesRequest,
  uploadEntityImage as uploadEntityImageRequest,
  type ReorderEntityImagesInput
} from "../api/images.client";
import {
  createEntityRelation as createEntityRelationRequest,
  deleteEntityRelation as deleteEntityRelationRequest,
  type CreateEntityRelationInput
} from "../api/related.client";
import {
  ENTITIES_KEY,
  entityKey,
  entityImagesKey,
  relatedEntitiesKey
} from "./entity.swr-keys";
import type { Entity, EntityImage } from "./entity.types";

export function useEntityMutations() {
  const { mutate } = useSWRConfig();

  const createEntity = useCallback(
    async (input: CreateEntityInput): Promise<Entity> => {
      const entity = await createEntityRequest(input);
      await Promise.all([
        mutate(ENTITIES_KEY),
        mutate(entityKey(entity.id), entity, false)
      ]);
      return entity;
    },
    [mutate]
  );

  const updateEntity = useCallback(
    async (entityId: string, input: UpdateEntityInput): Promise<Entity> => {
      const entity = await updateEntityRequest(entityId, input);
      await Promise.all([
        mutate(ENTITIES_KEY),
        mutate(entityKey(entityId), entity, false)
      ]);
      return entity;
    },
    [mutate]
  );

  const createEntityRelation = useCallback(
    async (entityId: string, input: CreateEntityRelationInput): Promise<void> => {
      await createEntityRelationRequest(entityId, input);
      await Promise.all([
        mutate(relatedEntitiesKey(entityId)),
        mutate(relatedEntitiesKey(input.relatedEntityId))
      ]);
    },
    [mutate]
  );

  const deleteEntityRelation = useCallback(
    async (entityId: string, relatedEntityId: string): Promise<void> => {
      await deleteEntityRelationRequest(entityId, relatedEntityId);
      await Promise.all([
        mutate(relatedEntitiesKey(entityId)),
        mutate(relatedEntitiesKey(relatedEntityId))
      ]);
    },
    [mutate]
  );

  const uploadEntityImage = useCallback(
    async (entityId: string, file: File): Promise<EntityImage> => {
      const image = await uploadEntityImageRequest(entityId, file);
      await mutate(entityImagesKey(entityId));
      return image;
    },
    [mutate]
  );

  const deleteEntityImage = useCallback(
    async (entityId: string, imageId: string): Promise<void> => {
      await deleteEntityImageRequest(entityId, imageId);
      await mutate(entityImagesKey(entityId));
    },
    [mutate]
  );

  const reorderEntityImages = useCallback(
    async (entityId: string, input: ReorderEntityImagesInput): Promise<void> => {
      await reorderEntityImagesRequest(entityId, input);
      await mutate(entityImagesKey(entityId));
    },
    [mutate]
  );

  return {
    createEntity,
    updateEntity,
    createEntityRelation,
    deleteEntityRelation,
    uploadEntityImage,
    deleteEntityImage,
    reorderEntityImages
  };
}
