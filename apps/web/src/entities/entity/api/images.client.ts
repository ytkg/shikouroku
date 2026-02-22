import type { EntityImage } from "../model/entity.types";
import {
  parseEntityImageMutationResponse,
  parseEntityImageResponse,
  parseEntityImagesResponse
} from "./images.response";
import { requestFormData, requestJson } from "@/shared/api/http.client";
import {
  getEntityImageOrderPath,
  getEntityImagePath,
  getEntityImagesPath
} from "@/shared/config/api-paths";

export type ReorderEntityImagesInput = {
  orderedImageIds: string[];
};

export async function fetchEntityImages(entityId: string): Promise<EntityImage[]> {
  const json = await requestJson<unknown>(getEntityImagesPath(entityId));
  return parseEntityImagesResponse(json);
}

export async function uploadEntityImage(entityId: string, file: File): Promise<EntityImage> {
  const formData = new FormData();
  formData.set("file", file);

  const json = await requestFormData<unknown>(getEntityImagesPath(entityId), {
    method: "POST",
    body: formData
  });
  return parseEntityImageResponse(json);
}

export async function deleteEntityImage(entityId: string, imageId: string): Promise<void> {
  const json = await requestJson<unknown>(getEntityImagePath(entityId, imageId), {
    method: "DELETE"
  });
  parseEntityImageMutationResponse(json);
}

export async function reorderEntityImages(
  entityId: string,
  input: ReorderEntityImagesInput
): Promise<void> {
  const json = await requestJson<unknown>(getEntityImageOrderPath(entityId), {
    method: "PATCH",
    body: input
  });
  parseEntityImageMutationResponse(json);
}
