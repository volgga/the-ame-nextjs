"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { AppImage } from "@/components/ui/AppImage";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type FullscreenViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (idx: number) => void;
  productTitle: string;
  /** Варианты изображения для первого изображения (опционально) */
  mainImageVariants?: {
    image_url?: string | null;
    image_thumb_url?: string | null;
    image_medium_url?: string | null;
    image_large_url?: string | null;
    image_thumb_avif_url?: string | null;
    image_medium_avif_url?: string | null;
    image_large_avif_url?: string | null;
  };
};

/**
 * Полноэкранный просмотр фото с поддержкой:
 * - pinch zoom двумя пальцами (mobile)
 * - swipe left/right для переключения фото
 * - drag при увеличении
 * - click-to-zoom на desktop
 * - fullscreen overlay (100vw 100vh)
 */
export function FullscreenViewer({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  productTitle,
  mainImageVariants,
}: FullscreenViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [canCloseByOverlay, setCanCloseByOverlay] = useState(false);
  const [hasHover, setHasHover] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setHasHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCanCloseByOverlay(false);
      setIsZoomed(false);
    }
  }, [isOpen, currentIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const imagesLen = images.length;
  const hasMultipleImages = imagesLen > 1;

  const goPrev = () => {
    if (imagesLen <= 1) return;
    setCanCloseByOverlay(false);
    onIndexChange(currentIndex === 0 ? imagesLen - 1 : currentIndex - 1);
  };

  const goNext = () => {
    if (imagesLen <= 1) return;
    setCanCloseByOverlay(false);
    onIndexChange(currentIndex === imagesLen - 1 ? 0 : currentIndex + 1);
  };

  const handleOverlayClick = () => {
    if (!hasHover) {
      onClose();
      return;
    }
    if (canCloseByOverlay && !isZoomed) {
      onClose();
    }
  };

  const handlePhotoBoxMouseEnter = () => {
    if (hasHover) setCanCloseByOverlay(false);
  };

  const handlePhotoBoxMouseLeave = () => {
    if (hasHover) setCanCloseByOverlay(true);
  };

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isZoomed) return;
    // Prevent default scrolling when swiping horizontally
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isZoomed) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Swipe threshold: horizontal movement > 50px, horizontal > vertical, time < 300ms
    if (absDeltaX > 50 && absDeltaX > absDeltaY && deltaTime < 300) {
      if (deltaX > 0) {
        goPrev();
      } else {
        goNext();
      }
    }

    touchStartRef.current = null;
  };

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen || imagesLen <= 1) return;
    const prevIndex = currentIndex === 0 ? imagesLen - 1 : currentIndex - 1;
    const nextIndex = currentIndex === imagesLen - 1 ? 0 : currentIndex + 1;
    
    const preloadImage = (src: string) => {
      const img = new Image();
      img.src = src;
    };

    if (images[prevIndex]) preloadImage(images[prevIndex]);
    if (images[nextIndex]) preloadImage(images[nextIndex]);
  }, [isOpen, currentIndex, images, imagesLen]);

  if (!isOpen || !mounted) return null;

  const currentImage = images[currentIndex];
  const isValidSrc = currentImage && typeof currentImage === "string" && currentImage.trim().length > 0;

  const content = (
    <div
      className="fixed inset-0 bg-black/90 transition-opacity duration-200 z-[99999]"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={handleOverlayClick}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <div
        className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 flex-1 min-w-0 min-h-0 w-full h-full"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Desktop navigation arrows - без фона */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="hidden md:flex shrink-0 min-w-[48px] min-h-[48px] w-12 h-12 items-center justify-center text-white hover:text-white/80 transition-opacity z-10"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          </>
        )}

        <div className="relative flex flex-col flex-1 min-w-0 min-h-0 w-full h-full overflow-hidden">
          {/* Mobile navigation and close button */}
          <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex items-center justify-between shrink-0 w-auto gap-2 z-20">
            {hasMultipleImages && (
              <button
                type="button"
                onClick={goPrev}
                className="md:hidden shrink-0 w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-opacity"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0" />
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-opacity"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            {hasMultipleImages && (
              <button
                type="button"
                onClick={goNext}
                className="md:hidden shrink-0 w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-opacity"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Image container with zoom/pan */}
          <div
            className="relative flex-1 min-h-0 w-full h-full overflow-hidden p-3 md:p-4"
            onMouseEnter={handlePhotoBoxMouseEnter}
            onMouseLeave={handlePhotoBoxMouseLeave}
          >
            {isValidSrc ? (
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
                doubleClick={{ disabled: true }}
                panning={{ disabled: false }}
                wheel={{ step: 0.1 }}
                pinch={{ step: 5 }}
                limitToBounds={false}
                centerOnInit={true}
                onTransformed={(ref) => {
                  setIsZoomed(ref.state.scale > 1);
                }}
                onPanningStart={() => {
                  setCanCloseByOverlay(false);
                }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <TransformComponent
                    wrapperClass="!w-full !h-full flex items-center justify-center"
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <div
                      className="relative w-full h-full max-w-full max-h-full flex items-center justify-center"
                      onClick={(e) => {
                        // Click to zoom on desktop
                        if (hasHover && !isZoomed) {
                          e.preventDefault();
                          zoomIn();
                        } else if (hasHover && isZoomed) {
                          e.preventDefault();
                          resetTransform();
                          setIsZoomed(false);
                        }
                      }}
                    >
                      <AppImage
                        src={currentImage}
                        alt={`${productTitle} — фото ${currentIndex + 1}`}
                        fill
                        variant="gallery"
                        sizes="100vw"
                        className="object-contain object-center pointer-events-none"
                        draggable={false}
                        unoptimized={currentImage.startsWith("data:") || currentImage.includes("blob:")}
                        loading="eager"
                        priority
                        imageData={currentIndex === 0 && mainImageVariants ? mainImageVariants : undefined}
                      />
                    </div>
                  </TransformComponent>
                )}
              </TransformWrapper>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white/60 text-sm">
                {process.env.NODE_ENV === "development" && (
                  <div className="text-center">
                    <p>Изображение не загружено</p>
                    <p className="text-xs mt-1">src: {String(currentImage).substring(0, 50)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop navigation arrow right - без фона */}
        {hasMultipleImages && (
          <button
            type="button"
            onClick={goNext}
            className="hidden md:flex shrink-0 min-w-[48px] min-h-[48px] w-12 h-12 items-center justify-center text-white hover:text-white/80 transition-opacity z-10"
            aria-label="Следующее фото"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
