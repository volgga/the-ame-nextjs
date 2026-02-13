"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FlowerCard } from "./FlowerCard";
import { Flower } from "@/types/flower";
import type { Product } from "@/lib/products";

/** Desktop: 24 карточки (4 строки по 4 колонки), step +24. Mobile: 12 карточек (6 строк по 2 колонки), step +12. */
const INITIAL_DESKTOP = 24;
const INITIAL_MOBILE = 12;
const STEP_DESKTOP = 24;
const STEP_MOBILE = 12;
const MOBILE_BREAKPOINT = "(max-width: 767px)";

type SortValue = "default" | "price_asc" | "price_desc";

/**
 * FlowerCatalog — каталог товаров. Данные приходят с сервера.
 * Фильтрация и сортировка через URL: minPrice, maxPrice, sort, q.
 * Заголовок и панель фильтров рендерятся страницей.
 */
type FlowerCatalogProps = {
  products: Product[];
};

export const FlowerCatalog = ({ products: allProducts }: FlowerCatalogProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_DESKTOP);
  const pathname = usePathname();

  // Определяем мобильное устройство при первом рендере
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => {
      const nowMobile = mq.matches;
      setIsMobile(nowMobile);
      // При первом определении устанавливаем правильный initialCount
      if (visibleCount === INITIAL_DESKTOP && nowMobile) {
        setVisibleCount(INITIAL_MOBILE);
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const STEP = isMobile ? STEP_MOBILE : STEP_DESKTOP;
  const searchParams = useSearchParams();
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const sortParam = (searchParams.get("sort") as SortValue) ?? "default";
  const qParam = (searchParams.get("q") ?? "").trim().toLowerCase();
  const colorsParam = searchParams.get("colors") ?? "";
  const selectedColorKeys = colorsParam
    ? colorsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const minPrice = minPriceParam ? Number(minPriceParam) : 0;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : Infinity;

  // Преобразуем Product[] в Flower[]
  const flowers: Flower[] = useMemo(
    () =>
      allProducts.map((p) => {
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
      }),
    [allProducts]
  );

  // Фильтрация по цене, поиску и цвету букета
  const filteredFlowers = useMemo(() => {
    return flowers.filter((flower) => {
      const price = flower.price ?? 0;
      if (!(price >= minPrice && price <= maxPrice)) return false;
      if (qParam && !(flower.name ?? "").toLowerCase().includes(qParam)) return false;
      if (selectedColorKeys.length > 0) {
        const product = allProducts.find((p) => p.id === flower.id);
        const productColors = product?.bouquetColors ?? [];
        const hasMatch = productColors.some((k) => selectedColorKeys.includes(k));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [flowers, allProducts, minPrice, maxPrice, qParam, selectedColorKeys]);

  // Сортировка (не мутируем исходный массив)
  const sortedFlowers = useMemo(() => {
    const arr = [...filteredFlowers];
    if (sortParam === "price_asc") {
      return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }
    if (sortParam === "price_desc") {
      return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    // default — порядок как есть (с сервера)
    return arr;
  }, [filteredFlowers, sortParam]);

  // При смене фильтров/сортировки/поиска — сбрасываем к начальному значению
  useEffect(() => {
    const initial = isMobile ? INITIAL_MOBILE : INITIAL_DESKTOP;
    setVisibleCount(initial);
  }, [minPrice, maxPrice, sortParam, qParam, selectedColorKeys, isMobile]);

  // Clamp visibleCount если количество товаров уменьшилось
  useEffect(() => {
    if (visibleCount > sortedFlowers.length) {
      setVisibleCount(sortedFlowers.length);
    }
  }, [sortedFlowers.length, visibleCount]);

  // Вычисляем видимые товары
  const visibleFlowers = useMemo(() => {
    return sortedFlowers.slice(0, visibleCount);
  }, [sortedFlowers, visibleCount]);

  const remaining = sortedFlowers.length - visibleFlowers.length;
  const hasMore = remaining > 0;

  return (
    <div>
      {/* Каталог: 2 колонки mobile, 4 на desktop; меньший gap — карточки крупнее */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {visibleFlowers.map((flower) => {
          // Находим соответствующий Product для передачи дополнительных данных
          const product = allProducts.find((p) => p.id === flower.id);
          return <FlowerCard key={flower.id} flower={flower} product={product} />;
        })}
      </div>

      {/* Debug info (только в dev режиме) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 text-xs text-gray-500 p-2 bg-gray-100 rounded">
          total: {sortedFlowers.length} | visibleCount: {visibleCount} | rendered: {visibleFlowers.length} | remaining: {remaining}
        </div>
      )}

      {/* Кнопка "Показать ещё" */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setVisibleCount((prev) => Math.min(prev + STEP, sortedFlowers.length));
            }}
            className="rounded-full border border-[var(--color-outline-border)] bg-white px-6 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
          >
            Показать ещё
          </button>
        </div>
      )}

      {/* Пустой результат */}
      {sortedFlowers.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-color-text-secondary">Цветы не найдены</p>
          <Link
            href={pathname}
            className="inline-block rounded-full border border-[var(--color-outline-border)] bg-white px-4 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
          >
            Сбросить фильтры
          </Link>
        </div>
      )}
    </div>
  );
};
