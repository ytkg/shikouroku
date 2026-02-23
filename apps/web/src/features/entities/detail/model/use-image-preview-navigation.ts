import { type PointerEvent, useCallback, useEffect, useState } from "react";
import type { EntityImage } from "@/entities/entity";

type UseImagePreviewNavigationResult = {
  selectedImage: EntityImage | null;
  canMoveToPreviousImage: boolean;
  canMoveToNextImage: boolean;
  openPreview: (imageId: string) => void;
  closePreview: () => void;
  showPreviousImage: () => void;
  showNextImage: () => void;
  switchImageByPreviewAreaPointer: (event: PointerEvent<HTMLDivElement>) => void;
};

export function useImagePreviewNavigation(images: EntityImage[]): UseImagePreviewNavigationResult {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? null;
  const selectedImageIndex = selectedImage ? images.findIndex((image) => image.id === selectedImage.id) : -1;
  const canMoveToPreviousImage = selectedImageIndex > 0;
  const canMoveToNextImage = selectedImageIndex >= 0 && selectedImageIndex < images.length - 1;

  const openPreview = useCallback((imageId: string) => {
    setSelectedImageId(imageId);
  }, []);

  const closePreview = useCallback(() => {
    setSelectedImageId(null);
  }, []);

  const showPreviousImage = useCallback(() => {
    if (!canMoveToPreviousImage) {
      return;
    }

    const previousImage = images[selectedImageIndex - 1];
    if (!previousImage) {
      return;
    }

    setSelectedImageId(previousImage.id);
  }, [canMoveToPreviousImage, images, selectedImageIndex]);

  const showNextImage = useCallback(() => {
    if (!canMoveToNextImage) {
      return;
    }

    const nextImage = images[selectedImageIndex + 1];
    if (!nextImage) {
      return;
    }

    setSelectedImageId(nextImage.id);
  }, [canMoveToNextImage, images, selectedImageIndex]);

  const switchImageByPreviewAreaPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const previewRect = event.currentTarget.getBoundingClientRect();
      const isLeftSide = event.clientX < previewRect.left + previewRect.width / 2;
      if (isLeftSide) {
        showPreviousImage();
        return;
      }

      showNextImage();
    },
    [showNextImage, showPreviousImage]
  );

  useEffect(() => {
    if (!selectedImageId) {
      return;
    }

    if (images.some((image) => image.id === selectedImageId)) {
      return;
    }

    setSelectedImageId(null);
  }, [images, selectedImageId]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        showPreviousImage();
        return;
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedImage, showPreviousImage, showNextImage]);

  return {
    selectedImage,
    canMoveToPreviousImage,
    canMoveToNextImage,
    openPreview,
    closePreview,
    showPreviousImage,
    showNextImage,
    switchImageByPreviewAreaPointer
  };
}
