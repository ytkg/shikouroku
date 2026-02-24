export type KindRecord = {
  id: number;
  label: string;
};

export type TagRecord = {
  id: number;
  name: string;
};

export type EntityRecord = {
  id: string;
  kind_id: number;
  name: string;
  description: string | null;
  is_wishlist: number;
  created_at: string;
  updated_at: string;
};

export type EntityWithKindRecord = EntityRecord & {
  kind_label: string;
};

export type EntityWithKindAndFirstImageRecord = EntityWithKindRecord & {
  first_image_id: string | null;
};

export type EntityTagRecord = {
  entity_id: string;
  id: number;
  name: string;
};

export type EntityWithTagsRecord = EntityRecord & { tags: TagRecord[] };

export type EntityLocationRecord = {
  entity_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
};

export type EntityImageRecord = {
  id: string;
  entity_id: string;
  object_key: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  created_at: string;
};
