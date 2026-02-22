import type { EntityImageRecord } from "../../../../shared/db/records";

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type EntityImageResponseDto = {
  id: string;
  entity_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  url: string;
  created_at: string;
};

export type UploadImageFile = Pick<File, "name" | "type" | "size" | "arrayBuffer">;

export function toImageFilePath(entityId: string, imageId: string): string {
  return `/api/entities/${encodeURIComponent(entityId)}/images/${encodeURIComponent(imageId)}/file`;
}

export function toEntityImageResponse(image: EntityImageRecord): EntityImageResponseDto {
  return {
    id: image.id,
    entity_id: image.entity_id,
    file_name: image.file_name,
    mime_type: image.mime_type,
    file_size: image.file_size,
    sort_order: image.sort_order,
    url: toImageFilePath(image.entity_id, image.id),
    created_at: image.created_at
  };
}

export function toFileExtension(mimeType: string): string | null {
  if (mimeType === "image/jpeg") return "jpeg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return null;
}

export function normalizeFileName(fileName: string, fallback: string): string {
  const normalized = fileName.trim();
  return normalized.length > 0 ? normalized : fallback;
}

export function hasSameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }

  return true;
}

export function toErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  return null;
}
