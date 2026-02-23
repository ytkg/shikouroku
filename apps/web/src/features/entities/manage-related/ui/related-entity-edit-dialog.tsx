import { useEffect, useMemo, useState } from "react";
import type { Entity } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/form-controls";
import { Select } from "@/shared/ui/form-controls/select";
import { Input } from "@/shared/ui/input";
import { ModalShell } from "@/shared/ui/modal-shell";

type RelatedEntityEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Entity[];
  selectedRelatedEntityIds: string[];
  onToggleRelatedEntity: (entityId: string, checked: boolean) => void;
};

export function RelatedEntityEditDialog({
  open,
  onOpenChange,
  candidates,
  selectedRelatedEntityIds,
  onToggleRelatedEntity
}: RelatedEntityEditDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKindId, setSelectedKindId] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedKindId("");
    }
  }, [open]);

  const kindOptions = useMemo(() => {
    const kindMap = new Map<number, string>();
    for (const candidate of candidates) {
      if (!kindMap.has(candidate.kind.id)) {
        kindMap.set(candidate.kind.id, candidate.kind.label);
      }
    }

    return Array.from(kindMap.entries()).map(([id, label]) => ({ id, label }));
  }, [candidates]);

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    return candidates.filter((candidate) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        candidate.name.toLocaleLowerCase().includes(normalizedQuery);
      const matchesKind =
        selectedKindId.length === 0 || String(candidate.kind.id) === selectedKindId;
      return matchesQuery && matchesKind;
    });
  }, [candidates, searchQuery, selectedKindId]);

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="関連嗜好を編集"
      contentClassName="max-w-md"
    >
      <h2 className="text-base font-semibold">関連嗜好を編集</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        チェックを付けると関連追加、外すと関連解除になります。
      </p>
      <p className="mt-2 text-sm text-muted-foreground">選択中: {selectedRelatedEntityIds.length}件</p>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground">候補一覧</p>
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="候補を検索"
          aria-label="候補を検索"
        />
        <Select
          value={selectedKindId}
          onChange={(event) => setSelectedKindId(event.target.value)}
          aria-label="種別で絞り込み"
        >
          <option value="">すべての種別</option>
          {kindOptions.map((kind) => (
            <option key={kind.id} value={kind.id}>
              {kind.label}
            </option>
          ))}
        </Select>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">追加できる候補がありません。</p>
        ) : visibleCandidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">候補がありません。</p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-auto rounded-md border p-2">
            {visibleCandidates.map((candidate) => {
              const selected = selectedRelatedEntityIds.includes(candidate.id);
              return (
                <label
                  key={candidate.id}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                    selected ? "bg-muted/70 font-medium" : ""
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onChange={(event) => onToggleRelatedEntity(candidate.id, event.target.checked)}
                  />
                  <span className="flex-1">
                    {candidate.name}（{candidate.kind.label}）
                  </span>
                  {selected && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">選択中</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          閉じる
        </Button>
      </div>
    </ModalShell>
  );
}
