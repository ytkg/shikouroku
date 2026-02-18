export type Kind = {
  id: number;
  label: string;
};

export type Entity = {
  id: string;
  kind_id: number;
  name: string;
  description: string | null;
  is_wishlist: number;
  created_at?: string;
  updated_at?: string;
};
