import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/form-controls";
import { Label } from "@/shared/ui/label";
import type { MapTagOption } from "./entity-map-types";

type EntityMapFilterControlsProps = {
  selectedTagId: string;
  nameQuery: string;
  tagOptions: MapTagOption[];
  onTagChange: (value: string) => void;
  onNameQueryChange: (value: string) => void;
};

export function EntityMapFilterControls({
  selectedTagId,
  nameQuery,
  tagOptions,
  onTagChange,
  onNameQueryChange
}: EntityMapFilterControlsProps) {
  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="entity-map-tag-filter">タグ</Label>
          <Select
            id="entity-map-tag-filter"
            className="h-8 px-2 text-xs md:text-xs"
            value={selectedTagId}
            onChange={(event) => onTagChange(event.target.value)}
          >
            <option value="all">すべて</option>
            {tagOptions.map((tag) => (
              <option key={tag.id} value={String(tag.id)}>
                {tag.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="entity-map-name-filter">名前検索</Label>
          <Input
            id="entity-map-name-filter"
            className="h-8 px-2 text-base md:text-sm"
            value={nameQuery}
            onChange={(event) => onNameQueryChange(event.target.value)}
            placeholder="キーワードを入力"
          />
        </div>
      </div>
    </section>
  );
}
