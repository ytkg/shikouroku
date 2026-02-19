import type { Entity, Kind, Tag } from "../model/entity-types";
import { createInvalidApiResponseError } from "@/shared/api/api-error";
import {
  expectArray,
  expectNullableString,
  expectNumber,
  expectObject,
  expectOptionalString,
  expectString,
  expectTrue
} from "@/shared/api/response-validators";

type JsonObject = Record<string, unknown>;

function expectWishlistFlag(value: unknown, path: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === 0 || value === 1) {
    return value === 1;
  }

  throw createInvalidApiResponseError(`Invalid API response: ${path} must be 0, 1 or boolean`);
}

function expectOkRoot(value: unknown, rootName: string): JsonObject {
  const root = expectObject(value, rootName);
  expectTrue(root.ok, `${rootName}.ok`);
  return root;
}

function parseKind(value: unknown, path: string): Kind {
  const kind = expectObject(value, path);
  return {
    id: expectNumber(kind.id, `${path}.id`),
    label: expectString(kind.label, `${path}.label`)
  };
}

function parseTag(value: unknown, path: string): Tag {
  const tag = expectObject(value, path);
  return {
    id: expectNumber(tag.id, `${path}.id`),
    name: expectString(tag.name, `${path}.name`)
  };
}

function parseEntity(value: unknown, path: string): Entity {
  const entity = expectObject(value, path);
  const tagsValue = entity.tags;
  const tags =
    tagsValue === undefined
      ? []
      : expectArray(tagsValue, `${path}.tags`).map((tag, index) =>
          parseTag(tag, `${path}.tags[${index}]`)
        );

  return {
    id: expectString(entity.id, `${path}.id`),
    kind: parseKind(entity.kind, `${path}.kind`),
    name: expectString(entity.name, `${path}.name`),
    description: expectNullableString(entity.description, `${path}.description`),
    isWishlist: expectWishlistFlag(entity.is_wishlist, `${path}.is_wishlist`),
    tags,
    createdAt: expectOptionalString(entity.created_at, `${path}.created_at`),
    updatedAt: expectOptionalString(entity.updated_at, `${path}.updated_at`)
  };
}

export function parseKindsResponse(value: unknown): Kind[] {
  const root = expectOkRoot(value, "kindsResponse");
  return expectArray(root.kinds, "kindsResponse.kinds").map((kind, index) =>
    parseKind(kind, `kindsResponse.kinds[${index}]`)
  );
}

export function parseTagsResponse(value: unknown): Tag[] {
  const root = expectOkRoot(value, "tagsResponse");
  return expectArray(root.tags, "tagsResponse.tags").map((tag, index) =>
    parseTag(tag, `tagsResponse.tags[${index}]`)
  );
}

export function parseTagResponse(value: unknown): Tag {
  const root = expectOkRoot(value, "tagResponse");
  return parseTag(root.tag, "tagResponse.tag");
}

export function parseEntitiesResponse(value: unknown): Entity[] {
  const root = expectOkRoot(value, "entitiesResponse");
  return expectArray(root.entities, "entitiesResponse.entities").map((entity, index) =>
    parseEntity(entity, `entitiesResponse.entities[${index}]`)
  );
}

export function parseEntityResponse(value: unknown): Entity {
  const root = expectOkRoot(value, "entityResponse");
  return parseEntity(root.entity, "entityResponse.entity");
}

export function parseOkResponse(value: unknown): void {
  expectOkRoot(value, "okResponse");
}
