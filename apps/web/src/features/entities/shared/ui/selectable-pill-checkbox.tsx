import type { ReactNode } from "react";
import { Checkbox } from "@/shared/ui/form-controls";

type SelectablePillCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function SelectablePillCheckbox({
  checked,
  onCheckedChange,
  children,
  className
}: SelectablePillCheckboxProps) {
  return (
    <label className={`ui-pill cursor-pointer gap-2 px-3 py-1.5 text-sm ${className ?? ""}`.trim()}>
      <Checkbox
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      {children}
    </label>
  );
}
