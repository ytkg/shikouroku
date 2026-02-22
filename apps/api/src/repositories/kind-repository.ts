import type { KindRecord } from "../domain/models";
import { findKindByIdFromD1, listKindsFromD1 } from "../modules/catalog/kind/infra/kind-repository-d1";

export async function listKinds(db: D1Database): Promise<KindRecord[]> {
  return listKindsFromD1(db);
}

export async function findKindById(db: D1Database, id: number): Promise<KindRecord | null> {
  return findKindByIdFromD1(db, id);
}

export async function existsKind(db: D1Database, id: number): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM kinds WHERE id = ? LIMIT 1").bind(id).first<{ id: number }>();
  return Boolean(row);
}
