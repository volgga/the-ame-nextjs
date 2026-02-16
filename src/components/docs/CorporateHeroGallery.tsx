"use client";

import { useState, useCallback, useRef } from "react";
import { AppImage } from "@/components/ui/AppImage";
import { ChevronArrow } from "@/components/hero/ChevronArrow";

const TRANSITION_MS = 500;

type CorporateHeroGalleryProps = {
  images: string[];
  /** Фиксированная высота контейнера (адаптивная): мобилка — aspect, десктоп — фикс. высота */
  className?: string;
};

/**
 * Галерея для страницы «Корпоративные заказы»:
 * - несколько фото, object-fit: cover, фиксированная высота блока
 * - стрелки и точки, свайп на мобиле
 */
export function CorporateHeroGallery({ images, className = "" }: CorporateHeroGalleryProps) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const count = images.length;
  const loopSlides = count > 1 ? [...images, images[0]] : images;
  const currentIndex = count <= 1 ? 0 : index % count;

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIsTransitioning(true);
      setIndex((i) => {
        const next = i + delta;
        if (next >= loopSlides.length - 1) {
          setTimeout(() => {
            setIsTransitioning(false);
            setIndex(0);
            requestAnimationFrame(() => setIsTransitioning(true));
          }, TRANSITION_MS);
          return next;
        }
        if (next < 0) return loopSlides.length - 2;
        return next;
      });
    },
    [count, loopSlides.length]
  );

  const prev = useCallback(() => go(-1), [go]);
  const next = useCallback(() => go(1), [go]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || count <= 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      if (deltaX < 0) next();
      else prev();
    },
    [count, next, prev]
  );

  const emptyMinHeight = "min-h-[280px]";

  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-[#ece9e2] text-gray-500 h-full ${emptyMinHeight} ${className}`}
      >
        <span className="text-sm">Фото пока нет</span>
      </div>
    );
  }

  const btnBase =
    "absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] hover:text-white/95 transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

  return (
    <div className={`relative overflow-hidden bg-[#ece9e2] h-full min-h-0 ${className}`}>
      <div
        className="flex h-full min-h-0 transition-transform ease-in-out touch-pan-y"
        style={{
          width: `${loopSlides.length * 100}%`,
          transform: `translateX(-${index * (100 / loopSlides.length)}%)`,
          transitionDuration: isTransitioning ? `${TRANSITION_MS}ms` : "0ms",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loopSlides.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative flex-shrink-0 w-full h-full overflow-hidden"
            style={{ width: `${100 / loopSlides.length}%` }}
          >
            <AppImage
              src={src}
              alt=""
              fill
              variant="gallery"
              className="object-cover object-center select-none pointer-events-none"
              loading={i === 0 ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Предыдущее фото"
            className={`left-3 sm:left-4 ${btnBase}`}
          >
            <ChevronArrow direction="left" className="w-5 h-6 shrink-0" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Следующее фото"
            className={`right-3 sm:right-4 ${btnBase}`}
          >
            <ChevronArrow direction="right" className="w-5 h-6 shrink-0" />
          </button>
          <div
            className="absolute left-0 right-0 flex justify-center gap-1.5 z-20"
            style={{ bottom: "14px" }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setIndex(i);
                }}
                aria-label={`Фото ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
