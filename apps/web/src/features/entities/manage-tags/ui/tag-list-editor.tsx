import type { Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";

type TagListEditorProps = {
  tags: Tag[];
  disabled: boolean;
  deletingTagId: number | null;
  onDelete: (tag: Tag) => Promise<void>;
};

export function TagListEditor({ tags, disabled, deletingTagId, onDelete }: TagListEditorProps) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">タグが登録されていません。</p>;
  }

  return (
    <div className="max-h-56 space-y-2 overflow-auto">
      {tags.map((tag) => (
        <div key={tag.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <span className="text-sm">{tag.name}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void onDelete(tag);
            }}
            disabled={disabled}
          >
            {deletingTagId === tag.id ? "削除中..." : "削除"}
          </Button>
        </div>
      ))}
    </div>
  );
}
