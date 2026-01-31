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
  /** Текущий slug категории или null для "Все цветы" */
  currentSlug: string | null;
};

/**
 * CategoryChips — горизонтальные кнопки-чипсы категорий.
 * Активная категория подсвечена, wrap на новую строку.
 */
export function CategoryChips({ categories, currentSlug }: CategoryChipsProps) {
  return (
    <div
      className="w-full max-w-full px-4 md:px-6 flex flex-wrap justify-center gap-3"
      role="group"
      aria-label="Категории каталога"
    >
      {categories.map((cat) => {
        const href = cat.isAll ? ALL_CATALOG.href : `/magazine/${cat.slug}`;
        const isActive = cat.isAll ? currentSlug === null : cat.slug === currentSlug;

        return (
          <Link
            key={cat.isAll ? "all" : cat.slug}
            href={href}
            className={`
              inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${isActive
                ? "border-foreground/30 bg-muted text-foreground"
                : "border-border bg-background text-foreground hover:bg-muted/80 hover:border-foreground/20"
              }
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
