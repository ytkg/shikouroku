import { useEffect, useRef, useState } from "react";
import type { EntityImage } from "@/entities/entity";

type EntityDetailImageGalleryProps = {
  images: EntityImage[];
  imagesLoading: boolean;
  onSelectImage: (imageId: string) => void;
};

export function EntityDetailImageGallery({
  images,
  imagesLoading,
  onSelectImage
}: EntityDetailImageGalleryProps) {
  const [isImageListScrolled, setIsImageListScrolled] = useState(false);
  const imageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const imageList = imageListRef.current;
    if (!imageList) {
      setIsImageListScrolled(false);
      return;
    }

    setIsImageListScrolled(imageList.scrollLeft > 2);
  }, [images]);

  if (!imagesLoading && images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">画像</p>
      {imagesLoading ? (
        <p className="text-sm">読み込み中...</p>
      ) : (
        <div className="relative">
          <div
            ref={imageListRef}
            className="grid grid-flow-col auto-cols-[calc((100%-2rem)/4.5)] gap-2 overflow-x-auto pb-1"
            onScroll={(event) => {
              setIsImageListScrolled(event.currentTarget.scrollLeft > 2);
            }}
          >
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                className="block w-full overflow-hidden rounded-lg border border-border/70 bg-muted"
                onClick={() => onSelectImage(image.id)}
              >
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="aspect-square h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          {images.length > 4 && (
            <>
              {isImageListScrolled && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background/80 via-background/40 to-transparent"
                  aria-hidden="true"
                />
              )}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background/80 via-background/40 to-transparent"
                aria-hidden="true"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
