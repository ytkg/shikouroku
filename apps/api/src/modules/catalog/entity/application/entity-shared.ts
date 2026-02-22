import type {
  EntityWithKindAndFirstImageRecord,
  EntityWithKindRecord,
  EntityWithTagsRecord,
  KindRecord,
  TagRecord
} from "../../../../domain/models";
import { countExistingTagsByIdsFromD1 } from "../../tag/infra/tag-repository-d1";

export type UpsertEntityCommand = {
  kindId: number;
  name: string;
  description: string;
  isWishlist: boolean;
  tagIds: number[];
};

export type EntityResponseDto = {
  id: string;
  kind: KindRecord;
  name: string;
  description: string | null;
  is_wishlist: number;
  tags: TagRecord[];
  first_image_url?: string | null;
  created_at: string;
  updated_at: string;
};

export function uniqTagIds(tagIds: number[]): number[] {
  return [...new Set(tagIds)];
}

export async function validateTagIds(db: D1Database, tagIds: number[]): Promise<boolean> {
  if (tagIds.length === 0) {
    return true;
  }

  const count = await countExistingTagsByIdsFromD1(db, tagIds);
  return count === tagIds.length;
}

export function toDescription(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function toWishlistFlag(value: boolean): number {
  return value ? 1 : 0;
}

function toImageFilePath(entityId: string, imageId: string): string {
  return `/api/entities/${encodeURIComponent(entityId)}/images/${encodeURIComponent(imageId)}/file`;
}

export function toEntityResponse(
  entity: EntityWithTagsRecord,
  kind: KindRecord,
  firstImageId?: string | null
): EntityResponseDto {
  return {
    id: entity.id,
    kind,
    name: entity.name,
    description: entity.description,
    is_wishlist: entity.is_wishlist,
    tags: entity.tags,
    ...(firstImageId !== undefined
      ? {
          first_image_url: firstImageId ? toImageFilePath(entity.id, firstImageId) : null
        }
      : {}),
    created_at: entity.created_at,
    updated_at: entity.updated_at
  };
}

export function toEntityWithTagsRecord(
  entity: EntityWithKindRecord,
  tags: TagRecord[]
): EntityWithTagsRecord {
  return {
    id: entity.id,
    kind_id: entity.kind_id,
    name: entity.name,
    description: entity.description,
    is_wishlist: entity.is_wishlist,
    tags,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  };
}

export function toEntityWithFirstImageResponse(
  entity: EntityWithKindAndFirstImageRecord,
  tags: TagRecord[]
): EntityResponseDto {
  return toEntityResponse(
    toEntityWithTagsRecord(entity, tags),
    { id: entity.kind_id, label: entity.kind_label },
    entity.first_image_id
  );
}
