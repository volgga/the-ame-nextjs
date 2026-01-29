"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { Flower } from "@/types/flower";

/**
 * FeaturedProducts — использует данные из src/lib/products.ts.
 *
 * Почему "use client":
 * - кнопка "Показать ещё" (локальное состояние).
 *
 * Позже:
 * - заменим на SSR загрузку товаров из Supabase.
 */
export function FeaturedProducts() {
  const [showAll, setShowAll] = useState(false);
  const { addToCart } = useCart();

  const allProducts = getAllProducts();

  // Преобразуем Product[] в Flower[] для совместимости
  const homepageItems: Flower[] = useMemo(
    () =>
      allProducts.map((p) => ({
        id: p.id,
        name: p.title,
        price: p.price,
        image: p.image,
        description: p.shortDescription,
        category: "Разное",
        inStock: true,
        quantity: 1,
        colors: [],
        size: "medium",
        occasion: [],
        slug: p.slug,
        categorySlug: null,
      })),
    [allProducts]
  );

  const displayed = showAll ? homepageItems : homepageItems.slice(0, 12);

  const handleAddToCart = (flower: Flower) => {
    addToCart(flower);
    // TODO: добавить toast уведомления
  };

  if (!homepageItems.length) return null;

  return (
    <section className="relative isolate py-20 bg-[#fff8ea]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {displayed.map((item) => {
            const href = `/product/${item.slug}`;
            const priceText = `${item.price.toLocaleString("ru-RU")} ₽`;

            return (
              <div key={item.id} className="group flex flex-col h-full">
                <Link
                  href={href}
                  aria-label={item.name}
                  className="block flex-1 flex flex-col"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="aspect-square bg-[#ece9e2]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "https://theame.ru/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>

                  <div className="mt-3 px-1">
                    <h3 className="text-[15px] md:text-base font-medium leading-snug line-clamp-2 min-h-[42px] md:min-h-0">
                      {item.name}
                    </h3>
                    <div className="mt-1">
                      <span className="text-base md:text-lg font-semibold">
                        {priceText}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="px-1 pt-3 mt-auto">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(item);
                    }}
                    className="w-full inline-flex items-center justify-center rounded-full px-6 h-10 text-sm md:text-base font-semibold bg-[#819570] hover:bg-[#6f7f5f] text-white"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!showAll && displayed.length < homepageItems.length && (
          <div className="text-center mt-12">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-full px-8 h-11 text-base font-semibold bg-[#819570] hover:bg-[#6f7f5f] text-white shadow"
            >
              Показать ещё
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

