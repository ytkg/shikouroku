import type { EntityImage } from "../model/entity.types";
import {
  expectArray,
  expectNumber,
  expectObject,
  expectString,
  expectTrue
} from "@/shared/api/response-validators";

type JsonObject = Record<string, unknown>;

function expectOkRoot(value: unknown, rootName: string): JsonObject {
  const root = expectObject(value, rootName);
  expectTrue(root.ok, `${rootName}.ok`);
  return root;
}

function parseImage(value: unknown, path: string): EntityImage {
  const image = expectObject(value, path);
  return {
    id: expectString(image.id, `${path}.id`),
    entityId: expectString(image.entity_id, `${path}.entity_id`),
    fileName: expectString(image.file_name, `${path}.file_name`),
    mimeType: expectString(image.mime_type, `${path}.mime_type`),
    fileSize: expectNumber(image.file_size, `${path}.file_size`),
    sortOrder: expectNumber(image.sort_order, `${path}.sort_order`),
    url: expectString(image.url, `${path}.url`),
    createdAt: expectString(image.created_at, `${path}.created_at`)
  };
}

export function parseEntityImagesResponse(value: unknown): EntityImage[] {
  const root = expectOkRoot(value, "entityImagesResponse");
  return expectArray(root.images, "entityImagesResponse.images").map((image, index) =>
    parseImage(image, `entityImagesResponse.images[${index}]`)
  );
}

export function parseEntityImageResponse(value: unknown): EntityImage {
  const root = expectOkRoot(value, "entityImageResponse");
  return parseImage(root.image, "entityImageResponse.image");
}

export function parseEntityImageMutationResponse(value: unknown): void {
  expectOkRoot(value, "entityImageMutationResponse");
}
