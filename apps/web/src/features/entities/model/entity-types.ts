export type Kind = {
  id: number;
  label: string;
};

export type Tag = {
  id: number;
  name: string;
};

export type Entity = {
  id: string;
  kindId: number;
  kind?: Kind;
  name: string;
  description: string | null;
  isWishlist: boolean;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};
