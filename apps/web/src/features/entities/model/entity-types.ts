export type Kind = {
  id: number;
  label: string;
};

export type Entity = {
  id: string;
  kindId: number;
  name: string;
  description: string | null;
  isWishlist: boolean;
  createdAt?: string;
  updatedAt?: string;
};
