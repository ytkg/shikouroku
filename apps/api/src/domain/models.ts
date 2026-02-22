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

export type EntityWithKindRow = EntityRow & {
  kind_label: string;
};

export type EntityTagRow = {
  entity_id: string;
  id: number;
  name: string;
};

export type EntityWithTagsRow = EntityRow & { tags: TagRow[] };

export type EntityImageRow = {
  id: string;
  entity_id: string;
  object_key: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  created_at: string;
};
