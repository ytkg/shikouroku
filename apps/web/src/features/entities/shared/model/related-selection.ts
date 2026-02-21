export function addRelatedEntityId(current: string[], entityId: string): string[] {
  if (current.includes(entityId)) {
    return current;
  }

  return [...current, entityId];
}

export function removeRelatedEntityId(current: string[], entityId: string): string[] {
  return current.filter((id) => id !== entityId);
}

export function toggleRelatedEntityId(
  current: string[],
  entityId: string,
  checked: boolean
): string[] {
  return checked
    ? addRelatedEntityId(current, entityId)
    : removeRelatedEntityId(current, entityId);
}

export function diffRelatedEntityIds(previous: string[], next: string[]): {
  toAdd: string[];
  toRemove: string[];
} {
  const previousSet = new Set(previous);
  const nextSet = new Set(next);

  return {
    toAdd: next.filter((entityId) => !previousSet.has(entityId)),
    toRemove: previous.filter((entityId) => !nextSet.has(entityId))
  };
}
