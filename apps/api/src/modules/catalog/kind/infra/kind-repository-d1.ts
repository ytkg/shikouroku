import type { KindRecord } from "../../../../shared/db/records";
import type { KindRepository } from "../ports/kind-repository";

export async function listKindsFromD1(db: D1Database): Promise<KindRecord[]> {
  const result = await db.prepare("SELECT id, label FROM kinds ORDER BY id ASC").all<KindRecord>();
  return result.results ?? [];
}

export async function findKindByIdFromD1(db: D1Database, id: number): Promise<KindRecord | null> {
  const kind = await db
    .prepare("SELECT id, label FROM kinds WHERE id = ? LIMIT 1")
    .bind(id)
    .first<KindRecord>();

  return kind ?? null;
}

export function createD1KindRepository(db: D1Database): KindRepository {
  return {
    listKinds: () => listKindsFromD1(db),
    findKindById: (id) => findKindByIdFromD1(db, id)
  };
}
