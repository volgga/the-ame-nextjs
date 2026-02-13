"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "@/lib/constants";
import { slugify } from "@/utils/slugify";

/** Элемент списка цветов (из справочника flowers) */
export type FlowerFilterItem = {
  id?: string;
  name: string;
  slug: string;
  is_active?: boolean;
};

type FlowerFilterButtonsProps = {
  flowers: FlowerFilterItem[];
};

/**
 * Кнопки-фильтры цветов в составе. Стили и логика 1:1 с OccasionFilterButtons («По поводу»).
 * Кнопки «Все цветы» нет: сброс фильтра — через клик по категории «Цветы в составе» вверху.
 */
export function FlowerFilterButtons({ flowers }: FlowerFilterButtonsProps) {
  const pathname = usePathname();

  if (flowers.length === 0) {
    return null;
  }

  // Активный цветок по slug в URL; на /magazine/cvety-v-sostave без сегмента — ни один не активен
  const rawActiveSlug = pathname.includes(`/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/`)
    ? pathname.split(`/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/`)[1]?.split("/")[0] || null
    : null;
  // Транслитерируем activeSlug для сравнения с транслитерированными slug цветов
  const activeSlug = rawActiveSlug && /[а-яё]/i.test(rawActiveSlug) ? slugify(rawActiveSlug) : rawActiveSlug;

  return (
    <div
      className="w-full max-w-5xl mx-auto flex flex-wrap justify-center gap-2.5"
      role="group"
      aria-label="Цветы в составе"
    >
      {flowers
        .filter((flower) => flower.slug && flower.is_active !== false)
        .map((flower) => {
          // Транслитерируем slug в латиницу, если содержит кириллицу (для корректных URL)
          const rawSlug = flower.slug!;
          const slug = /[а-яё]/i.test(rawSlug) ? slugify(rawSlug) : rawSlug;
          const isActive = activeSlug === slug;
          const href = isActive
            ? `/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}`
            : `/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/${slug}`;

          return (
            <Link
              key={flower.id ?? flower.slug}
              href={href}
              scroll={false}
              className={`
                inline-flex items-center justify-center rounded border px-4 py-2 text-sm font-medium
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2
                border-[var(--color-outline-border)] text-color-text-main
                ${isActive ? "bg-btn-chip-active" : "bg-white hover:bg-[rgba(31,42,31,0.06)]"}
              `}
              aria-current={isActive ? "page" : undefined}
              aria-label={isActive ? `${flower.name} (активен)` : flower.name}
            >
              {flower.name}
            </Link>
          );
        })}
    </div>
  );
}
