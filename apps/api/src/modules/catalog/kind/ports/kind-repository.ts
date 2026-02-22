import type { KindRecord } from "../../../../shared/db/records";

export type KindRepository = {
  listKinds: () => Promise<KindRecord[]>;
  findKindById: (id: number) => Promise<KindRecord | null>;
};
