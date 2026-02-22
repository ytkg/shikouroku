import type { KindRecord } from "../../../../shared/db/records";

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
