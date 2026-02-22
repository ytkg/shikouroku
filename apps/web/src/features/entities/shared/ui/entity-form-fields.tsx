import type { Entity, Kind, Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Checkbox, Select, Textarea } from "@/shared/ui/form-controls";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type RelatedCandidate = Pick<Entity, "id" | "name" | "kind">;

type EntityFormFieldsProps = {
  kinds: Kind[];
  tags: Tag[];
  kindId: string;
  name: string;
  description: string;
  isWishlist: boolean;
  selectedTagIds: number[];
  onKindIdChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onWishlistChange: (checked: boolean) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
  onOpenTagDialog: () => void;
  relatedCandidates?: RelatedCandidate[];
  selectedRelatedEntityIds?: string[];
  onOpenRelatedDialog?: () => void;
  kindRequired?: boolean;
};

export function EntityFormFields({
  kinds,
  tags,
  kindId,
  name,
  description,
  isWishlist,
  selectedTagIds,
  onKindIdChange,
  onNameChange,
  onDescriptionChange,
  onWishlistChange,
  onToggleTag,
  onOpenTagDialog,
  relatedCandidates,
  selectedRelatedEntityIds,
  onOpenRelatedDialog,
  kindRequired = true
}: EntityFormFieldsProps) {
  const hasRelatedEditor =
    relatedCandidates !== undefined &&
    selectedRelatedEntityIds !== undefined &&
    onOpenRelatedDialog !== undefined;
  const relatedCandidatesSafe = relatedCandidates ?? [];
  const selectedRelatedEntityIdsSafe = selectedRelatedEntityIds ?? [];
  const relatedLabelById = new Map(
    relatedCandidatesSafe.map((candidate) => [
      candidate.id,
      `${candidate.name}（${candidate.kind.label}）`
    ])
  );

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="kind">種別</Label>
        <Select
          id="kind"
          value={kindId}
          onChange={(event) => onKindIdChange(event.target.value)}
          required={kindRequired}
        >
          {kinds.map((kind) => (
            <option key={kind.id} value={kind.id}>
              {kind.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">名前</Label>
        <Input id="name" value={name} onChange={(event) => onNameChange(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">メモ</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>タグ</Label>
          <Button type="button" size="sm" variant="outline" onClick={onOpenTagDialog}>
            タグを編集
          </Button>
        </div>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">タグが登録されていません。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={(event) => onToggleTag(tag.id, event.target.checked)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        )}
      </div>
      {hasRelatedEditor && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>関連嗜好</Label>
            <Button type="button" size="sm" variant="outline" onClick={onOpenRelatedDialog}>
              関連を編集
            </Button>
          </div>
          {selectedRelatedEntityIdsSafe.length === 0 ? (
            <p className="text-sm text-muted-foreground">（関連なし）</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedRelatedEntityIdsSafe.map((entityId) => (
                <span key={entityId} className="rounded-full border px-2 py-0.5 text-xs">
                  {relatedLabelById.get(entityId) ?? entityId}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={isWishlist}
          onChange={(event) => onWishlistChange(event.target.checked)}
        />
        気になる
      </label>
    </>
  );
}
