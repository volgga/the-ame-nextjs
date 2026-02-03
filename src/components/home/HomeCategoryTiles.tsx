"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { HomeCollection } from "@/lib/homeCollections";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";

type HomeCategoryTilesProps = {
  collections: HomeCollection[];
};

/**
 * Блок «КОЛЛЕКЦИИ THE ÁME» — сетка карточек коллекций на главной.
 * Данные из админки (home_collections). Заголовок + кнопка «СМОТРЕТЬ ВСЁ» над гридом.
 * Если коллекций нет — блок скрыт.
 */
export function HomeCategoryTiles({ collections }: HomeCategoryTilesProps) {
  if (!collections.length) return null;

  return (
    <section
      className={`bg-page-bg pb-12 md:pb-16 ${MAIN_PAGE_BLOCK_GAP}`}
      aria-labelledby="collections-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2
              id="collections-heading"
              className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] uppercase tracking-tight"
            >
              КОЛЛЕКЦИИ THE ÁME
            </h2>
            <Link
              href="/magazin"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium uppercase tracking-tight text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 shrink-0"
            >
              СМОТРЕТЬ ВСЁ
              <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {collections.map((col) => {
            const href =
              !col.categorySlug || col.categorySlug === "magazin"
                ? "/magazin"
                : `/magazine/${col.categorySlug}`;
            const imageSrc = col.imageUrl || "https://theame.ru/placeholder.svg";
            return (
            <Link
              key={col.id}
              href={href}
              className="group relative block w-full aspect-square overflow-hidden rounded-2xl bg-[#ece9e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline-border)] focus-visible:ring-offset-2"
              aria-label={col.name}
            >
              <Image
                src={imageSrc}
                alt=""
                fill
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
              <div
                className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent"
                aria-hidden
              />
              <span className="absolute bottom-0 left-0 right-0 p-4 text-white font-semibold text-lg md:text-xl drop-shadow-md">
                {col.name}
              </span>
            </Link>
          );
          })}
        </div>
      </div>
    </section>
  );
}
