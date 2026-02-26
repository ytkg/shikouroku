import type { EntityLocationPin, Tag } from "@/entities/entity";

export type MapLocationEntity = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type MapTagOption = {
  id: number;
  label: string;
};

export type EntityLocationMapData = EntityLocationPin;

export type LocationTagLookup = Map<string, Tag[]>;
