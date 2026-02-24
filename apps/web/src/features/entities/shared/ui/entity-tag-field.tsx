import type { Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/form-controls";
import { Label } from "@/shared/ui/label";

type EntityTagFieldProps = {
  tags: Tag[];
  selectedTagIds: number[];
  onToggleTag: (tagId: number, checked: boolean) => void;
  onOpenTagDialog: () => void;
};

export function EntityTagField({
  tags,
  selectedTagIds,
  onToggleTag,
  onOpenTagDialog
}: EntityTagFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>タグ</Label>
        <Button type="button" size="sm" variant="outline" onClick={onOpenTagDialog}>
          タグを編集
        </Button>
      </div>
      {tags.length === 0 ? (
        <p className="ui-body-text text-muted-foreground">タグが登録されていません。</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label key={tag.id} className="ui-pill ui-pill-muted gap-2 px-3 py-1.5 text-sm">
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
  );
}
