"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Subcategory } from "@/lib/subcategories";
import { OCCASIONS_CATEGORY_SLUG } from "@/lib/constants";

interface OccasionFilterButtonsProps {
  occasions: Subcategory[];
}

/**
 * Кнопки-фильтры поводов в стиле круглых чипов категорий (CategoryChips).
 * Показывается под списком категорий в категории "По поводу".
 * Кнопки "Все поводы" нет: сброс фильтра — через клик по категории "По поводу" вверху.
 * Стили 1:1 с CategoryChips: rounded-full, border, bg-btn-chip-active / bg-white hover.
 */
export function OccasionFilterButtons({ occasions }: OccasionFilterButtonsProps) {
  const pathname = usePathname();

  if (occasions.length === 0) {
    return null;
  }

  // Активный повод по slug в URL; на /magazine/po-povodu без сегмента — ни один не активен
  const activeSlug = pathname.includes(`/${OCCASIONS_CATEGORY_SLUG}/`)
    ? pathname.split(`/${OCCASIONS_CATEGORY_SLUG}/`)[1]?.split("/")[0] || null
    : null;

  return (
    <div
      className="w-full max-w-5xl mx-auto flex flex-wrap justify-center gap-2.5"
      role="group"
      aria-label="Поводы"
    >
      {occasions
        .filter((occasion) => occasion.slug && occasion.is_active !== false)
        .map((occasion) => {
          const slug = occasion.slug!;
          const isActive = activeSlug === slug;
          // Активный повод: ссылка ведёт на базовую страницу (снять фильтр); иначе — на страницу повода
          const href = isActive ? `/magazine/${OCCASIONS_CATEGORY_SLUG}` : `/magazine/${OCCASIONS_CATEGORY_SLUG}/${slug}`;

          return (
            <Link
              key={occasion.id}
              href={href}
              scroll={false}
              className={`
                inline-flex items-center justify-center rounded border px-4 py-2 text-sm font-medium
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2
                border-[var(--color-outline-border)] text-color-text-main
                ${isActive ? "bg-btn-chip-active" : "bg-white hover:bg-[rgba(31,42,31,0.06)]"}
              `}
              aria-current={isActive ? "page" : undefined}
              aria-label={isActive ? `${occasion.name} (активен)` : occasion.name}
            >
              {occasion.name}
            </Link>
          );
        })}
    </div>
  );
}
