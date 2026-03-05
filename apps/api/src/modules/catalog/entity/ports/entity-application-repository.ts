import type {
  EntityLocationRecord,
  EntityLocationWithKindRecord,
  EntityWithKindAndFirstImageRecord,
  EntityWithKindRecord,
  EntityWithTagsRecord,
  TagRecord
} from "../../../../shared/db/records";

export type EntitySearchMatch = "partial" | "prefix" | "exact";
export type EntitySearchField = "title" | "body" | "tags";
export type EntityWishlistFilter = "include" | "exclude" | "only";

export type ListEntitiesSearchInput = {
  kindId: number | null;
  wishlist: EntityWishlistFilter;
  q: string | null;
  match: EntitySearchMatch;
  fields: EntitySearchField[];
};

export type ListEntitiesInput = ListEntitiesSearchInput & {
  limit: number;
  cursorCreatedAt: string | null;
  cursorId: string | null;
};

export type EntityUpsertInput = {
  id: string;
  kindId: number;
  name: string;
  description: string | null;
  isWishlistFlag: number;
  latitude?: number;
  longitude?: number;
};

export type EntityApplicationRepository = {
  findEntityIdByKindAndName: (kindId: number, name: string) => Promise<{ id: string } | null>;
  insertEntityWithTags: (input: EntityUpsertInput, tagIds: number[]) => Promise<boolean>;
  updateEntityWithTags: (
    input: EntityUpsertInput,
    tagIds: number[]
  ) => Promise<"updated" | "not_found" | "error">;
  fetchEntityWithTags: (entityId: string) => Promise<EntityWithTagsRecord | null>;
  findEntityWithKindById: (id: string) => Promise<EntityWithKindRecord | null>;
  findEntityLocationByEntityId: (entityId: string) => Promise<EntityLocationRecord | null>;
  fetchTagsByEntityIds: (entityIds: string[]) => Promise<Map<string, TagRecord[]>>;
  listEntitiesWithKinds: (input: ListEntitiesInput) => Promise<EntityWithKindAndFirstImageRecord[]>;
  countEntitiesWithKinds: (input: ListEntitiesSearchInput) => Promise<number>;
  listEntityLocationsWithKinds: () => Promise<EntityLocationWithKindRecord[]>;
};
