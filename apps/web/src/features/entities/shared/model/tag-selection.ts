export function addTagId(current: number[], tagId: number): number[] {
  if (current.includes(tagId)) {
    return current;
  }
  return [...current, tagId];
}

export function removeTagId(current: number[], tagId: number): number[] {
  return current.filter((id) => id !== tagId);
}

export function toggleTagId(current: number[], tagId: number, checked: boolean): number[] {
  return checked ? addTagId(current, tagId) : removeTagId(current, tagId);
}
