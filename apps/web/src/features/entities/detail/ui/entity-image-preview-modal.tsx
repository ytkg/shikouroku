import { type PointerEvent } from "react";
import type { EntityImage } from "@/entities/entity";
import { Button } from "@/shared/ui/button";
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
      <div className="mb-2 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          閉じる
        </Button>
      </div>
      <div className="relative flex justify-center" onPointerUp={onSwitchByPreviewAreaPointer}>
        <img
          src={selectedImage.url}
          alt={selectedImage.fileName}
          className="max-h-[80vh] w-auto max-w-full rounded object-contain"
        />
        {canMoveToPreviousImage && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-3xl text-white/50"
            aria-hidden="true"
          >
            ←
          </div>
        )}
        {canMoveToNextImage && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-3xl text-white/50"
            aria-hidden="true"
          >
            →
          </div>
        )}
      </div>
    </ModalShell>
  );
}
