import {
  countEntitiesWithKindsFromD1,
  fetchTagsByEntityIdsFromD1,
  listEntitiesWithKindsFromD1
} from "../infra/entity-repository-d1";
import { success, type UseCaseResult } from "../../../../shared/application/result";
import { toEntityWithFirstImageResponse, type EntityResponseDto } from "./entity-shared";

export const ENTITY_SEARCH_MATCHES = ["partial", "prefix", "exact"] as const;
export type EntitySearchMatch = (typeof ENTITY_SEARCH_MATCHES)[number];

export const ENTITY_SEARCH_FIELDS = ["title", "body", "tags"] as const;
export type EntitySearchField = (typeof ENTITY_SEARCH_FIELDS)[number];

export const ENTITY_WISHLIST_FILTERS = ["include", "exclude", "only"] as const;
export type EntityWishlistFilter = (typeof ENTITY_WISHLIST_FILTERS)[number];

export type EntityListCursor = {
  createdAt: string;
  id: string;
};

export type ListEntitiesQueryInput = {
  limit: number;
  cursor: EntityListCursor | null;
  kindId: number | null;
  wishlist: EntityWishlistFilter;
  q: string;
  match: EntitySearchMatch;
  fields: EntitySearchField[];
};

export type EntityListPageDto = {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
};

function toCursorToken(createdAt: string, id: string): string {
  return `${encodeURIComponent(createdAt)}:${encodeURIComponent(id)}`;
}

export async function listEntitiesQuery(
  db: D1Database,
  input: ListEntitiesQueryInput
): Promise<UseCaseResult<{ entities: EntityResponseDto[]; page: EntityListPageDto }>> {
  const normalizedQuery = input.q.trim();
  const searchInput = {
    kindId: input.kindId,
    wishlist: input.wishlist,
    q: normalizedQuery.length > 0 ? normalizedQuery : null,
    match: input.match,
    fields: input.fields
  };
  const [entities, total] = await Promise.all([
    listEntitiesWithKindsFromD1(db, {
      limit: input.limit + 1,
      cursorCreatedAt: input.cursor?.createdAt ?? null,
      cursorId: input.cursor?.id ?? null,
      ...searchInput
    }),
    countEntitiesWithKindsFromD1(db, searchInput)
  ]);

  const hasMore = entities.length > input.limit;
  const visibleEntities = hasMore ? entities.slice(0, input.limit) : entities;
  const lastEntity = visibleEntities.at(-1);
  const nextCursor = hasMore && lastEntity ? toCursorToken(lastEntity.created_at, lastEntity.id) : null;

  const tagsByEntity = await fetchTagsByEntityIdsFromD1(
    db,
    visibleEntities.map((entity) => entity.id)
  );
  const entitiesWithKinds: EntityResponseDto[] = [];

  for (const entity of visibleEntities) {
    entitiesWithKinds.push(toEntityWithFirstImageResponse(entity, tagsByEntity.get(entity.id) ?? []));
  }

  return success({
    entities: entitiesWithKinds,
    page: {
      limit: input.limit,
      hasMore,
      nextCursor,
      total
    }
  });
}
