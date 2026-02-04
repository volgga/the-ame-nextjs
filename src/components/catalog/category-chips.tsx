"use client";

import Link from "next/link";
import { ALL_CATALOG } from "@/lib/catalogCategories";

export type CategoryChip = {
  slug: string;
  name: string;
  /** true если это ссылка "Все цветы" на /posmotret-vse-tsvety */
  isAll?: boolean;
};

type CategoryChipsProps = {
  categories: CategoryChip[];
  /** Текущий роут: null = активен "Все цветы", "magazin" = ни один не активен, иначе slug категории */
  currentSlug: string | null;
};

/**
 * CategoryChips — горизонтальные кнопки-чипсы категорий.
 * Активная подсветка по currentSlug: null → "Все цветы", "magazin" → ни один, иначе — категория с этим slug.
 * Чип "Каталог" (slug magazin) в блок не передаётся (фильтруется в AllFlowersPage / magazine/[slug]).
 */
export function CategoryChips({ categories, currentSlug }: CategoryChipsProps) {
  // Убираем дубликаты: если есть isAll=true, удаляем любые категории с slug "posmotret-vse-tsvety"
  const hasAllCategory = categories.some((cat) => cat.isAll);
  const filteredCategories = hasAllCategory
    ? categories.filter((cat) => cat.slug !== "posmotret-vse-tsvety")
    : categories;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-wrap justify-center gap-2.5" role="group" aria-label="Категории каталога">
      {filteredCategories.map((cat, index) => {
        const href = cat.isAll
          ? ALL_CATALOG.href
          : cat.slug === "posmotret-vse-tsvety"
            ? "/posmotret-vse-tsvety"
            : `/magazine/${cat.slug}`;
        const isActive = cat.isAll ? currentSlug === null : cat.slug === currentSlug;
        // Создаем уникальный ключ: для isAll используем специальный префикс, для остальных - slug
        // Добавляем индекс на случай дубликатов slug
        const uniqueKey = cat.isAll 
          ? `all-flowers-${ALL_CATALOG.href}` 
          : `${cat.slug || `category-${index}`}-${href}`;

        return (
          <Link
            key={uniqueKey}
            href={href}
            className={`
              inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2
              border-[var(--color-outline-border)] text-color-text-main
              ${isActive ? "bg-btn-chip-active" : "bg-white hover:bg-[rgba(31,42,31,0.06)]"}
            `}
            aria-current={isActive ? "page" : undefined}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}
