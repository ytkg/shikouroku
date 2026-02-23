import { type ReactNode, useEffect } from "react";
import { cn } from "@/shared/lib/utils";

type ModalShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  ariaLabel: string;
  canClose?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
};

export function ModalShell({
  open,
  onOpenChange,
  children,
  ariaLabel,
  canClose = true,
  overlayClassName,
  contentClassName
}: ModalShellProps) {
  useEffect(() => {
    if (!open || !canClose) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canClose, onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4", overlayClassName)}
      onMouseDown={(event) => {
        if (canClose && event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className={cn("w-full rounded-lg border bg-background p-4 shadow-lg", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
