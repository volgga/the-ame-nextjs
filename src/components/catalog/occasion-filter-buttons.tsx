"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Subcategory } from "@/lib/subcategories";
import { OCCASIONS_CATEGORY_SLUG } from "@/lib/constants";

interface OccasionFilterButtonsProps {
  occasions: Subcategory[];
}

/**
 * Компонент квадратных кнопок-фильтров поводов.
 * Показывается под списком категорий в категории "По поводу".
 * Стили: квадратные кнопки, светлый фон, тонкая рамка; активная — чёрная с белым текстом.
 * Визуально идентичен FlowerFilterButtons.
 * Использует slug в URL вместо query-параметров.
 */
export function OccasionFilterButtons({ occasions }: OccasionFilterButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (occasions.length === 0) {
    return null;
  }

  // Определяем активный повод по slug в URL
  const activeSlug = pathname.includes(`/${OCCASIONS_CATEGORY_SLUG}/`)
    ? pathname.split(`/${OCCASIONS_CATEGORY_SLUG}/`)[1]?.split("/")[0] || null
    : null;

  const handleOccasionClick = (occasionSlug: string | null) => {
    if (!occasionSlug) {
      // Переход на базовую страницу без фильтра
      router.push(`/magazine/${OCCASIONS_CATEGORY_SLUG}`, { scroll: false });
      return;
    }

    // Если кликнули по активной кнопке — снимаем фильтр
    if (activeSlug === occasionSlug) {
      router.push(`/magazine/${OCCASIONS_CATEGORY_SLUG}`, { scroll: false });
    } else {
      // Иначе переходим на SEO-страницу повода
      router.push(`/magazine/${OCCASIONS_CATEGORY_SLUG}/${occasionSlug}`, { scroll: false });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {/* Кнопка "Все поводы" */}
        <button
          type="button"
          onClick={() => handleOccasionClick(null)}
          className={`
            inline-flex items-center justify-center
            h-8 md:h-9
            px-3 md:px-4
            text-sm font-medium
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-[var(--color-bg-main)]
            rounded
            ${
              !activeSlug
                ? "bg-black text-white border border-black"
                : "bg-white text-color-text-main border border-[var(--color-outline-border)] hover:bg-[rgba(31,42,31,0.06)]"
            }
          `}
          aria-current={!activeSlug ? "page" : undefined}
          aria-label="Все поводы"
        >
          Все поводы
        </button>

        {/* Кнопки поводов */}
        {occasions
          .filter((occasion) => occasion.slug && occasion.is_active)
          .map((occasion) => {
            const isActive = activeSlug === occasion.slug;

            return (
              <button
                key={occasion.id}
                type="button"
                onClick={() => handleOccasionClick(occasion.slug || null)}
                className={`
                  inline-flex items-center justify-center
                  h-8 md:h-9
                  px-3 md:px-4
                  text-sm font-medium
                  transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  focus-visible:ring-[var(--color-bg-main)]
                  rounded
                  ${
                    isActive
                      ? "bg-black text-white border border-black"
                      : "bg-white text-color-text-main border border-[var(--color-outline-border)] hover:bg-[rgba(31,42,31,0.06)]"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Фильтр: ${occasion.name}${isActive ? " (активен)" : ""}`}
              >
                {occasion.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
