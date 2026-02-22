export type ImageCleanupTaskRecord = {
  id: number;
  object_key: string;
  reason: string;
  last_error: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
};

export async function enqueueImageCleanupTaskToD1(
  db: D1Database,
  objectKey: string,
  reason: string,
  lastError: string | null
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO image_cleanup_tasks (object_key, reason, last_error)
       VALUES (?, ?, ?)
       ON CONFLICT(object_key) DO UPDATE SET
         reason = excluded.reason,
         last_error = excluded.last_error,
         retry_count = image_cleanup_tasks.retry_count + 1,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(objectKey, reason, lastError)
    .run();

  return result.success;
}

export async function listImageCleanupTasksFromD1(
  db: D1Database,
  limit: number
): Promise<ImageCleanupTaskRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, object_key, reason, last_error, retry_count, created_at, updated_at
       FROM image_cleanup_tasks
       ORDER BY created_at ASC, id ASC
       LIMIT ?`
    )
    .bind(limit)
    .all<ImageCleanupTaskRecord>();

  return result.results ?? [];
}

export async function deleteImageCleanupTaskFromD1(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare("DELETE FROM image_cleanup_tasks WHERE id = ?").bind(id).run();
  return result.success;
}

export async function markImageCleanupTaskFailedInD1(
  db: D1Database,
  id: number,
  lastError: string | null
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE image_cleanup_tasks
       SET retry_count = retry_count + 1, last_error = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(lastError, id)
    .run();

  return result.success;
}

export async function countImageCleanupTasksInD1(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM image_cleanup_tasks")
    .first<{ count: number | string }>();

  return Number(row?.count ?? 0);
}
