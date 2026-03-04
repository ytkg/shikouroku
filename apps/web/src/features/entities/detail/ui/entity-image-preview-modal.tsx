import { type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EntityImage } from "@/entities/entity";
import { ModalShell } from "@/shared/ui/modal-shell";

type EntityImagePreviewModalProps = {
  selectedImage: EntityImage | null;
  canMoveToPreviousImage: boolean;
  canMoveToNextImage: boolean;
  onClose: () => void;
  onSwitchByPreviewAreaPointer: (event: PointerEvent<HTMLDivElement>) => void;
};

export function EntityImagePreviewModal({
  selectedImage,
  canMoveToPreviousImage,
  canMoveToNextImage,
  onClose,
  onSwitchByPreviewAreaPointer
}: EntityImagePreviewModalProps) {
  if (!selectedImage) {
    return null;
  }

  return (
    <ModalShell
      open={selectedImage !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      ariaLabel="画像プレビュー"
      overlayClassName="bg-black/60"
      contentClassName="max-w-4xl p-3"
    >
      <div className="relative flex justify-center" onPointerUp={onSwitchByPreviewAreaPointer}>
        <img
          src={selectedImage.url}
          alt={selectedImage.fileName}
          className="max-h-[80vh] w-auto max-w-full rounded object-contain"
        />
        {canMoveToPreviousImage && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-0"
            aria-hidden="true"
          >
            <span className="relative block h-12 w-12 opacity-60">
              <ChevronLeft className="absolute inset-0 h-12 w-12 text-black/85" strokeWidth={4.5} />
              <ChevronLeft className="absolute inset-0 h-12 w-12 text-white" strokeWidth={3} />
            </span>
          </div>
        )}
        {canMoveToNextImage && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-0"
            aria-hidden="true"
          >
            <span className="relative block h-12 w-12 opacity-60">
              <ChevronRight className="absolute inset-0 h-12 w-12 text-black/85" strokeWidth={4.5} />
              <ChevronRight className="absolute inset-0 h-12 w-12 text-white" strokeWidth={3} />
            </span>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
