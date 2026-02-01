"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FlowerCard } from "@/components/catalog/FlowerCard";
import { useFavorites } from "@/context/FavoritesContext";
import type { Product } from "@/lib/products";
import { Flower } from "@/types/flower";

type FavoritesPageClientProps = {
  products: Product[];
};

function productToFlower(p: Product): Flower {
  const hasVariants = p.variants && p.variants.length > 0;
  const variantPrices = hasVariants ? p.variants!.map((v) => v.price).filter(Number.isFinite) : [];
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices, p.price) : p.price;
  const priceFrom = hasVariants || p.id.startsWith("vp-");

  return {
    id: p.id,
    name: p.title,
    price: minPrice,
    image: p.image,
    description: p.shortDescription,
    category: "Разное",
    inStock: true,
    quantity: 1,
    colors: [],
    size: "medium",
    occasion: [],
    slug: p.slug,
    categorySlug: p.categorySlug ?? null,
    isPreorder: p.isPreorder,
    priceFrom,
  };
}

export function FavoritesPageClient({ products }: FavoritesPageClientProps) {
  const { items: favoriteIds, count, clearAll } = useFavorites();

  const favoriteFlowers = useMemo(() => {
    const set = new Set(favoriteIds);
    return products.filter((p) => set.has(p.id)).map(productToFlower);
  }, [products, favoriteIds]);

  const countLabel = count === 1 ? "1 товар" : count >= 2 && count <= 4 ? `${count} товара` : `${count} товаров`;

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container px-6 pt-5 pb-8 md:pt-6 md:pb-10">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Избранное" }]} />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-2">
              <Heart
                className="w-6 h-6 text-[var(--color-bg-main)] stroke-[var(--color-bg-main)]"
                strokeWidth={2}
                fill="none"
                aria-hidden
              />
              <h1 className="text-2xl md:text-3xl font-bold text-color-text-main uppercase tracking-tight">
                Избранное
              </h1>
            </div>
            <p className="mt-1 text-sm text-color-text-secondary">{count > 0 ? countLabel : "Нет избранных товаров"}</p>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="self-start sm:self-center inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[var(--color-outline-border)] bg-white text-color-text-main text-sm font-medium hover:bg-[var(--color-outline-hover-bg)] active:bg-[var(--color-outline-active-bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
              aria-label="Очистить все"
            >
              <Trash2 className="w-4 h-4" />
              Очистить все
            </button>
          )}
        </div>

        {/* Grid — как в каталоге */}
        {favoriteFlowers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {favoriteFlowers.map((flower) => (
              <FlowerCard key={flower.id} flower={flower} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-color-text-secondary mb-4">
              Добавляйте понравившиеся товары в избранное, нажимая на сердечко на карточке.
            </p>
            <Link
              href="/posmotret-vse-tsvety"
              className="inline-block rounded-full px-6 py-3 text-sm font-medium text-white bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
