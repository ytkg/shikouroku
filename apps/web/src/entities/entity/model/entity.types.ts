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
  kind: Kind;
  name: string;
  description: string | null;
  isWishlist: boolean;
  tags: Tag[];
  location?: {
    latitude: number;
    longitude: number;
  };
  firstImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type EntityImage = {
  id: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  url: string;
  createdAt: string;
};
