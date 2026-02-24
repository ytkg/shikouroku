import type { ReactNode } from "react";

type EntityPageActionRowProps = {
  leftAction: ReactNode;
  rightAction: ReactNode;
};

export function EntityPageActionRow({
  leftAction,
  rightAction
}: EntityPageActionRowProps) {
  return <div className="flex w-full items-center justify-between">{leftAction}{rightAction}</div>;
}
