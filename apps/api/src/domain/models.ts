export type KindRow = {
  id: number;
  label: string;
};

export type TagRow = {
  id: number;
  name: string;
};

export type EntityRow = {
  id: string;
  kind_id: number;
  name: string;
  description: string | null;
  is_wishlist: number;
  created_at: string;
  updated_at: string;
};

export type EntityTagRow = {
  entity_id: string;
  id: number;
  name: string;
};

export type EntityWithTagsRow = EntityRow & { tags: TagRow[] };
