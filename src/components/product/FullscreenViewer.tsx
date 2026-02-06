"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type FullscreenViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (idx: number) => void;
  productTitle: string;
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
}: FullscreenViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [canCloseByOverlay, setCanCloseByOverlay] = useState(false);
  const [hasHover, setHasHover] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; offsetX: number; offsetY: number } | null>(null);
  const didDragRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={handleOverlayClick}
    >
      <div
        className="flex items-center justify-center gap-3 flex-shrink-0"
        style={{
          width: "calc(100vw - 48px)",
          height: "calc(100vh - 48px)",
          maxWidth: "1200px",
          maxHeight: "calc(100vh - 48px)",
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasMultipleImages && (
          <button
            type="button"
            onClick={goPrev}
            className="shrink-0 min-w-[56px] min-h-[56px] w-14 h-14 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-color-text-main transition-all z-10"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <div className="relative flex flex-col items-center flex-1 min-w-0 h-full min-h-0">
          <div className="flex justify-end w-full mb-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-color-text-secondary hover:text-color-text-main transition-all"
              aria-label="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={viewportRef}
            className="relative flex-1 min-h-0 w-full overflow-hidden"
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
                    <Image
                      src={src}
                      alt={`${productTitle} — фото ${idx + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain object-center pointer-events-none"
                      draggable={false}
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
            className="shrink-0 min-w-[56px] min-h-[56px] w-14 h-14 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-color-text-main transition-all z-10"
            aria-label="Следующее фото"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
