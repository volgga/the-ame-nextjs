"use client";

import Link from "next/link";
import Image from "next/image";
import type { HomeCategoryItem } from "@/lib/homeCategoryImages";
import { getCategoryImageUrl } from "@/lib/homeCategoryImages";

type HomeCategoryTilesProps = {
  categories: HomeCategoryItem[];
};

/**
 * Блок категорий на главной — квадратная плитка с фото и подписью поверх.
 * Клик ведёт на /magazine/[slug].
 */
export function HomeCategoryTiles({ categories }: HomeCategoryTilesProps) {
  if (!categories.length) return null;

  return (
    <section className="bg-page-bg py-12 md:py-16" aria-label="Категории каталога">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-end mb-4 md:mb-6">
          <Link
            href="/magazin"
            className="text-sm font-medium text-color-text-main hover:underline decoration-2 underline-offset-2"
          >
            Смотреть все
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => {
            const imageUrl = getCategoryImageUrl(cat.slug);
            const href = `/magazine/${cat.slug}`;
            const label = cat.displayName;

            return (
              <Link
                key={cat.id}
                href={href}
                className="group relative block w-full aspect-square overflow-hidden rounded-2xl bg-[#ece9e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline-border)] focus-visible:ring-offset-2"
                aria-label={label}
              >
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
                {/* Подпись поверх фото снизу: градиент для читаемости */}
                <div
                  className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent"
                  aria-hidden
                />
                <span className="absolute bottom-0 left-0 right-0 p-4 text-white font-semibold text-lg md:text-xl drop-shadow-md">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
