import { useMemo } from "react";
import type { Tag } from "@/entities/entity";
import { Button } from "@/shared/ui/button";

type TagListEditorProps = {
  tags: Tag[];
  query: string;
  disabled: boolean;
  deletingTagId: number | null;
  onDelete: (tag: Tag) => Promise<void>;
};

export function TagListEditor({ tags, query, disabled, deletingTagId, onDelete }: TagListEditorProps) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleTags = useMemo(() => {
    return [...tags]
      .sort((left, right) => {
        const nameCompare = left.name.localeCompare(right.name, "ja");
        if (nameCompare !== 0) {
          return nameCompare;
        }
        return left.id - right.id;
      })
      .filter((tag) => {
        if (normalizedQuery.length === 0) {
          return true;
        }
        return tag.name.toLocaleLowerCase().includes(normalizedQuery);
      });
  }, [normalizedQuery, tags]);

  return (
    <div className="h-56 overflow-auto">
      {tags.length === 0 ? (
        <div className="flex h-full items-center">
          <p className="text-sm text-muted-foreground">タグが登録されていません。</p>
        </div>
      ) : visibleTags.length === 0 ? (
        <div className="flex h-full items-center">
          <p className="text-sm text-muted-foreground">該当するタグがありません。</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTags.map((tag) => (
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
      )}
    </div>
  );
}
