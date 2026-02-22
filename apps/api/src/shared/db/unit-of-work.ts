export async function runD1UnitOfWork(
  db: D1Database,
  statements: D1PreparedStatement[]
): Promise<D1Result[] | null> {
  if (statements.length === 0) {
    return [];
  }

  try {
    return await db.batch(statements);
  } catch {
    return null;
  }
}

export function isSuccessfulD1UnitOfWork(results: D1Result[]): boolean {
  return results.every((result) => result.success);
}
