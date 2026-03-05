import type { EntityImageRecord } from "../../../../shared/db/records";

export type InsertEntityImageInput = {
  id: string;
  entityId: string;
  objectKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
};

export type DeleteEntityImageResult = "deleted" | "not_found" | "error";

export type EntityImageRepository = {
  listEntityImages: (entityId: string) => Promise<EntityImageRecord[]>;
  findEntityImageById: (entityId: string, imageId: string) => Promise<EntityImageRecord | null>;
  nextEntityImageSortOrder: (entityId: string) => Promise<number>;
  insertEntityImage: (input: InsertEntityImageInput) => Promise<boolean>;
  deleteEntityImageAndCollapseSortOrder: (
    entityId: string,
    imageId: string,
    deletedSortOrder: number
  ) => Promise<DeleteEntityImageResult>;
  reorderEntityImages: (entityId: string, orderedImageIds: string[]) => Promise<boolean>;
};
