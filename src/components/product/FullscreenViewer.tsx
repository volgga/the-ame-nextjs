"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

const ZOOM_SCALE = 1.75;

/**
 * Полноэкранный просмотр фото: click-to-zoom, drag-to-pan.
 * Закрытие по overlay только после mouseleave с фото (для устройств с мышью).
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [canCloseByOverlay, setCanCloseByOverlay] = useState(false);
  const [hasHover, setHasHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; offsetX: number; offsetY: number } | null>(null);
  const didDragRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  // Touch swipe handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    setHasHover(window.matchMedia("(hover: hover)").matches);
  }, []);
  const imagesLen = images.length;
  const hasMultipleImages = imagesLen > 1;
  const scale = isZoomed ? ZOOM_SCALE : 1;

  const resetZoom = () => {
    setIsZoomed(false);
    setOffset({ x: 0, y: 0 });
  };

  const clampOffset = (x: number, y: number, s: number) => {
    const v = viewportRef.current;
    if (!v || s <= 1) return { x: 0, y: 0 };
    const w = v.offsetWidth;
    const h = v.offsetHeight;
    const maxX = Math.max(0, (w * (s - 1)) / 2);
    const maxY = Math.max(0, (h * (s - 1)) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const goPrev = () => {
    if (imagesLen <= 1) return;
    setCanCloseByOverlay(false);
    onIndexChange(currentIndex === 0 ? imagesLen - 1 : currentIndex - 1);
    resetZoom();
  };

  const goNext = () => {
    if (imagesLen <= 1) return;
    setCanCloseByOverlay(false);
    onIndexChange(currentIndex === imagesLen - 1 ? 0 : currentIndex + 1);
    resetZoom();
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    const v = viewportRef.current;
    if (!v) return;

    if (isZoomed) {
      resetZoom();
      return;
    }

    const rect = v.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const dx = (v.offsetWidth / 2 - clickX) * (ZOOM_SCALE - 1);
    const dy = (v.offsetHeight / 2 - clickY) * (ZOOM_SCALE - 1);
    const clamped = clampOffset(dx, dy, ZOOM_SCALE);
    setIsZoomed(true);
    setOffset(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    didDragRef.current = false;
    if (!isZoomed) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    didDragRef.current = true;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setOffset(clampOffset(dragStartRef.current.offsetX + dx, dragStartRef.current.offsetY + dy, scale));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) setCanCloseByOverlay(false);
  }, [isOpen]);

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

  const handleOverlayClick = () => {
    // На touch-устройствах (нет hover) закрытие по тапу по оверлею всегда разрешено
    if (!hasHover) {
      onClose();
      return;
    }
    if (canCloseByOverlay) onClose();
  };

  const handlePhotoBoxMouseEnter = () => {
    if (hasHover) setCanCloseByOverlay(false);
  };

  const handlePhotoBoxMouseLeave = () => {
    if (hasHover) setCanCloseByOverlay(true);
  };

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Don't swipe when zoomed
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();
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
    const deltaTime = Date.now() - touchStartTimeRef.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Swipe threshold: horizontal movement > 50px, horizontal > vertical, time < 300ms
    if (absDeltaX > 50 && absDeltaX > absDeltaY && deltaTime < 300) {
      if (deltaX > 0) {
        // Swipe right -> previous image
        goPrev();
      } else {
        // Swipe left -> next image
        goNext();
      }
    }

    touchStartRef.current = null;
  };

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      className="flex flex-col md:flex-row items-center justify-center bg-black/90 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        zIndex: 99999,
      }}
    >
      <div
        className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 flex-1 min-w-0 min-h-0 w-full h-full"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {hasMultipleImages && (
          <button
            type="button"
            onClick={goPrev}
            className="hidden md:flex shrink-0 min-w-[48px] min-h-[48px] w-12 h-12 items-center justify-center text-white hover:text-white/80 transition-all z-10"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        <div className="relative flex flex-col flex-1 min-w-0 min-h-0 w-full overflow-hidden">
          {/* Кнопка закрытия вверху — на мобилке в одном ряду с навигацией */}
          <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex items-center justify-between shrink-0 w-auto gap-2 z-20">
            {hasMultipleImages && (
              <button
                type="button"
                onClick={goPrev}
                className="md:hidden shrink-0 w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-all"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0" />
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-all"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            {hasMultipleImages && (
              <button
                type="button"
                onClick={goNext}
                className="md:hidden shrink-0 w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-all"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div
            ref={viewportRef}
            className="relative flex-1 min-h-0 w-full h-full overflow-hidden"
            style={{ width: "100%", height: "100%" }}
            onMouseEnter={handlePhotoBoxMouseEnter}
            onMouseLeave={handlePhotoBoxMouseLeave}
          >
            {images.map((src, idx) => (
              <div
                key={src}
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out"
                style={{
                  opacity: idx === currentIndex ? 1 : 0,
                  pointerEvents: idx === currentIndex ? "auto" : "none",
                }}
              >
                <div
                  className="relative w-full h-full flex items-center justify-center select-none touch-none"
                  style={{
                    cursor: isDragging ? "grabbing" : isZoomed ? "zoom-out" : "zoom-in",
                  }}
                  onClick={handleClick}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onPointerCancel={handlePointerUp}
                >
                  <div
                    className="relative w-full h-full max-w-full max-h-full transition-transform duration-300 ease-out"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <AppImage
                      src={src}
                      alt={`${productTitle} — фото ${idx + 1}`}
                      fill
                      variant="gallery"
                      sizes="100vw"
                      className="object-contain object-center pointer-events-none"
                      draggable={false}
                      unoptimized={src.startsWith("data:") || src.includes("blob:")}
                      loading={idx === currentIndex ? "eager" : "lazy"}
                      imageData={idx === 0 && mainImageVariants ? mainImageVariants : undefined}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasMultipleImages && (
          <button
            type="button"
            onClick={goNext}
            className="hidden md:flex shrink-0 min-w-[48px] min-h-[48px] w-12 h-12 items-center justify-center text-white hover:text-white/80 transition-all z-10"
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
