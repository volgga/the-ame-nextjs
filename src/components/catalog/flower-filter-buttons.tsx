"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Subcategory } from "@/lib/subcategories";
import { FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "@/lib/constants";

type FlowerFilterButtonsProps = {
  flowers: Subcategory[];
};

/**
 * Компонент квадратных кнопок-фильтров цветов.
 * Показывается под списком категорий в категории "Цветы в составе".
 * Стили: квадратные кнопки, светлый фон, тонкая рамка; активная — чёрная с белым текстом.
 * Использует slug в URL вместо query-параметров.
 */
export function FlowerFilterButtons({ flowers }: FlowerFilterButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Если цветов нет — не показываем компонент
  if (flowers.length === 0) {
    return null;
  }

  // Определяем активный цветок по slug в URL
  const activeSlug = pathname.includes(`/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/`)
    ? pathname.split(`/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/`)[1]?.split("/")[0] || null
    : null;

  const handleFlowerClick = (flowerSlug: string | null) => {
    if (!flowerSlug) {
      // Переход на базовую страницу без фильтра
      router.push(`/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}`, { scroll: false });
      return;
    }

    // Если кликнули по активной кнопке — снимаем фильтр
    if (activeSlug === flowerSlug) {
      router.push(`/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}`, { scroll: false });
    } else {
      // Иначе переходим на SEO-страницу цветка
      router.push(`/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/${flowerSlug}`, { scroll: false });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {/* Кнопка "Все цветы" */}
        <button
          type="button"
          onClick={() => handleFlowerClick(null)}
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
          aria-label="Все цветы"
        >
          Все цветы
        </button>

        {/* Кнопки цветов */}
        {flowers
          .filter((flower) => flower.slug && flower.is_active)
          .map((flower) => {
            const isActive = activeSlug === flower.slug;

            return (
              <button
                key={flower.id}
                type="button"
                onClick={() => handleFlowerClick(flower.slug || null)}
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
                aria-label={`Фильтр: ${flower.name}${isActive ? " (активен)" : ""}`}
              >
                {flower.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
