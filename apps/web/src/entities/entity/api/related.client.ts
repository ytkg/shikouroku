import type { Entity } from "../model/entity.types";
import {
  parseRelatedEntitiesResponse,
  parseRelatedMutationResponse
} from "./related.response";
import { requestJson } from "@/shared/api/http.client";
import {
  getEntityRelatedPath,
  getEntityRelationPath
} from "@/shared/config/api-paths";

export type CreateEntityRelationInput = {
  relatedEntityId: string;
};

export async function fetchRelatedEntities(entityId: string): Promise<Entity[]> {
  const json = await requestJson<unknown>(getEntityRelatedPath(entityId));
  return parseRelatedEntitiesResponse(json);
}

export async function createEntityRelation(
  entityId: string,
  input: CreateEntityRelationInput
): Promise<void> {
  const json = await requestJson<unknown>(getEntityRelatedPath(entityId), {
    method: "POST",
    body: input
  });
  parseRelatedMutationResponse(json);
}

export async function deleteEntityRelation(
  entityId: string,
  relatedEntityId: string
): Promise<void> {
  const json = await requestJson<unknown>(getEntityRelationPath(entityId, relatedEntityId), {
    method: "DELETE"
  });
  parseRelatedMutationResponse(json);
}
