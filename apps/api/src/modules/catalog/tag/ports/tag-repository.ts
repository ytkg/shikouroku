import type { TagRecord } from "../../../../shared/db/records";

export type DeleteTagResult = "deleted" | "not_found" | "error";

export type TagRepository = {
  listTags: () => Promise<TagRecord[]>;
  findTagByName: (name: string) => Promise<TagRecord | null>;
  insertTag: (name: string) => Promise<TagRecord | null>;
  deleteTagWithRelations: (id: number) => Promise<DeleteTagResult>;
  countExistingTagsByIds: (tagIds: number[]) => Promise<number>;
};
