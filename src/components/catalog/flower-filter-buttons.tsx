"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Product } from "@/lib/products";
import { normalizeFlowerKey } from "@/lib/normalizeFlowerKey";
import { extractUniqueFlowers } from "@/lib/extractFlowersFromProduct";

type FlowerFilterButtonsProps = {
  products: Product[];
};

/**
 * Компонент квадратных кнопок-фильтров цветов.
 * Показывается под списком категорий в категории "Цветы в составе".
 * Стили: квадратные кнопки, светлый фон, тонкая рамка; активная — чёрная с белым текстом.
 */
export function FlowerFilterButtons({ products }: FlowerFilterButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const flowerParam = searchParams.get("flower");
  const activeFlowerKey = flowerParam ? normalizeFlowerKey(flowerParam) : null;

  // Собираем уникальные цветы из всех товаров (мемоизировано для оптимизации)
  const flowers = useMemo(() => extractUniqueFlowers(products), [products]);

  // Если цветов нет — не показываем компонент
  if (flowers.length === 0) {
    return null;
  }

  const handleFlowerClick = (flower: string) => {
    const flowerKey = normalizeFlowerKey(flower);
    const params = new URLSearchParams(searchParams.toString());

    // Если кликнули по активной кнопке — снимаем фильтр
    if (activeFlowerKey === flowerKey) {
      params.delete("flower");
    } else {
      // Иначе устанавливаем новый фильтр (используем нормализованный ключ)
      params.set("flower", flowerKey);
    }

    // Обновляем URL без перезагрузки страницы
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {flowers.map((flower) => {
          const flowerKey = normalizeFlowerKey(flower);
          const isActive = activeFlowerKey === flowerKey;

          return (
            <button
              key={flower}
              type="button"
              onClick={() => handleFlowerClick(flower)}
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
              aria-label={`Фильтр: ${flower}${isActive ? " (активен)" : ""}`}
            >
              {flower}
            </button>
          );
        })}
      </div>
    </div>
  );
}
