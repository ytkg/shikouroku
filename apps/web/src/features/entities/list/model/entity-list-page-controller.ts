import type { FetchEntitiesPageInput } from "@/entities/entity";
import type { EntityListSearchCriteria } from "./entity-list";

export const ENTITY_PAGE_LIMIT = 20;

type BuildEntityListFetchInputOptions = {
  cursor?: string | null;
  signal?: AbortSignal;
};

export function buildEntityListFetchInput(
  criteria: EntityListSearchCriteria,
  options: BuildEntityListFetchInputOptions = {}
): FetchEntitiesPageInput {
  return {
    q: criteria.rawQuery,
    kindId: criteria.kindId,
    wishlist: criteria.wishlistFilter,
    match: criteria.match,
    fields: criteria.selectedFields,
    limit: ENTITY_PAGE_LIMIT,
    cursor: options.cursor,
    signal: options.signal
  };
}
