export async function enqueueImageCleanupTask(
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
