import type { Entity } from "../model/entity.types";
import {
  parseEntitiesResponse,
  parseOkResponse
} from "./entities.response";
import { expectObject, expectTrue } from "@/shared/api/response-validators";

export function parseRelatedEntitiesResponse(value: unknown): Entity[] {
  const root = expectObject(value, "relatedEntitiesResponse");
  expectTrue(root.ok, "relatedEntitiesResponse.ok");

  return parseEntitiesResponse({
    ok: true,
    page: {
      limit: 0,
      hasMore: false,
      nextCursor: null,
      total: 0
    },
    entities: root.related
  });
}

export function parseRelatedMutationResponse(value: unknown): void {
  parseOkResponse(value);
}
