"use client";

import { MAIN_PAGE_BLOCK_GAP } from "@/components/ui/breadcrumbs";

const SKELETON_HEIGHT_PX = 920;

/**
 * Skeleton для блока ниже первого экрана на главной.
 * Фиксированная высота, 4–6 плашек под сетку карточек/коллекций, без layout shift.
 */
export function HomeBelowFoldSkeleton() {
  return (
    <div
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP} w-full`}
      style={{ minHeight: SKELETON_HEIGHT_PX }}
      aria-hidden
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl h-px bg-[var(--color-outline-border)]/30 rounded" />
        </div>
        {/* Заголовок-заглушка */}
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-4">
          <div className="h-9 w-64 rounded-lg bg-[var(--color-outline-border)]/25 animate-pulse" />
          <div className="h-10 w-32 rounded-full bg-[var(--color-outline-border)]/25 animate-pulse" />
        </div>
        {/* Сетка 2 колонки на мобиле, 3 на десктопе — 6 карточек */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden bg-[var(--color-outline-border)]/20 animate-pulse"
              style={{ aspectRatio: "1" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
