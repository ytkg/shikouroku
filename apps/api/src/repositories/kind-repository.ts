import type { KindRow } from "../domain/models";

export async function listKinds(db: D1Database): Promise<KindRow[]> {
  const result = await db.prepare("SELECT id, label FROM kinds ORDER BY id ASC").all<KindRow>();
  return result.results ?? [];
}

export async function existsKind(db: D1Database, id: number): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM kinds WHERE id = ? LIMIT 1").bind(id).first<{ id: number }>();
  return Boolean(row);
}
