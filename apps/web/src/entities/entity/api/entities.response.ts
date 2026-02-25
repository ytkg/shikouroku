import type { Entity, EntityLocationPin, Kind, Tag } from "../model/entity.types";
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

export type EntityListPage = {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
};

export type EntitiesPageResponse = {
  entities: Entity[];
  page: EntityListPage;
};

export type EntityLocationsResponse = {
  locations: EntityLocationPin[];
};

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

function expectOptionalNullableString(value: unknown, path: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return expectNullableString(value, path);
}

function expectBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw createInvalidApiResponseError(`Invalid API response: ${path} must be a boolean`);
  }

  return value;
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

function parseLocation(value: unknown, path: string): { latitude: number; longitude: number } {
  const location = expectObject(value, path);
  return {
    latitude: expectNumber(location.latitude, `${path}.latitude`),
    longitude: expectNumber(location.longitude, `${path}.longitude`)
  };
}

function parseEntityLocationPin(value: unknown, path: string): EntityLocationPin {
  const entity = expectObject(value, path);
  return {
    id: expectString(entity.id, `${path}.id`),
    kind: parseKind(entity.kind, `${path}.kind`),
    name: expectString(entity.name, `${path}.name`),
    tags: expectArray(entity.tags, `${path}.tags`).map((tag, index) =>
      parseTag(tag, `${path}.tags[${index}]`)
    ),
    location: parseLocation(entity.location, `${path}.location`)
  };
}

function parseEntity(value: unknown, path: string): Entity {
  const entity = expectObject(value, path);
  const tagsValue = entity.tags;
  const firstImageUrl = expectOptionalNullableString(
    entity.first_image_url,
    `${path}.first_image_url`
  );
  const location = entity.location === undefined ? undefined : parseLocation(entity.location, `${path}.location`);
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
    ...(location !== undefined ? { location } : {}),
    ...(firstImageUrl !== undefined ? { firstImageUrl } : {}),
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

export function parseEntitiesPageResponse(value: unknown): EntitiesPageResponse {
  const root = expectOkRoot(value, "entitiesResponse");
  const entities = expectArray(root.entities, "entitiesResponse.entities").map((entity, index) =>
    parseEntity(entity, `entitiesResponse.entities[${index}]`)
  );
  const page = expectObject(root.page, "entitiesResponse.page");
  return {
    entities,
    page: {
      limit: expectNumber(page.limit, "entitiesResponse.page.limit"),
      hasMore: expectBoolean(page.hasMore, "entitiesResponse.page.hasMore"),
      nextCursor: expectNullableString(page.nextCursor, "entitiesResponse.page.nextCursor"),
      total: expectNumber(page.total, "entitiesResponse.page.total")
    }
  };
}

export function parseEntitiesResponse(value: unknown): Entity[] {
  return parseEntitiesPageResponse(value).entities;
}

export function parseEntityLocationsResponse(value: unknown): EntityLocationsResponse {
  const root = expectOkRoot(value, "entityLocationsResponse");
  return {
    locations: expectArray(root.locations, "entityLocationsResponse.locations").map((location, index) =>
      parseEntityLocationPin(location, `entityLocationsResponse.locations[${index}]`)
    )
  };
}

export function parseEntityResponse(value: unknown): Entity {
  const root = expectOkRoot(value, "entityResponse");
  return parseEntity(root.entity, "entityResponse.entity");
}

export function parseOkResponse(value: unknown): void {
  expectOkRoot(value, "okResponse");
}
