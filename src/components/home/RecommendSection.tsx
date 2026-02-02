"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
import { buildProductUrl } from "@/utils/buildProductUrl";

type RecommendSectionProps = {
  products: Product[];
};

/**
 * Блок «Рекомендуем» — горизонтальная лента товаров из категории «Популярное».
 * Одна строка, горизонтальный скролл, scroll-snap на десктопе.
 */
export function RecommendSection({ products }: RecommendSectionProps) {
  if (!products.length) return null;

  return (
    <section className="bg-page-bg py-12 md:py-16" aria-labelledby="recommend-heading">
      <div className="container mx-auto px-4 md:px-6">
        <h2 id="recommend-heading" className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] mb-6 md:mb-8">
          Рекомендуем
        </h2>

        <div
          className="flex gap-4 md:gap-6 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        >
          {products.map((p) => {
            const href = buildProductUrl({ name: p.title, productSlug: p.slug });
            const priceText = p.isPreorder ? "Предзаказ" : `${p.price.toLocaleString("ru-RU")} ₽`;

            return (
              <Link
                key={p.id}
                href={href}
                className="group flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] snap-start"
                aria-label={p.title}
              >
                <div className="relative overflow-hidden rounded-2xl aspect-square bg-[#ece9e2]">
                  <Image
                    src={p.image || "https://theame.ru/placeholder.svg"}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
                  />
                </div>
                <h3 className="mt-3 text-sm md:text-base font-medium text-[var(--color-text-main)] line-clamp-2 min-h-[2.5em]">
                  {p.title}
                </h3>
                <p className="mt-1 text-base font-semibold text-[var(--color-text-main)]">{priceText}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
