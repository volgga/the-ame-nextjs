"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => {
      const nowMobile = mq.matches;
      setIsMobile(nowMobile);
      // При первом определении устанавливаем правильный initialCount
      if (!isInitializedRef.current) {
        setVisibleCount(nowMobile ? INITIAL_MOBILE : INITIAL_DESKTOP);
        isInitializedRef.current = true;
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const initialCount = isMobile ? INITIAL_MOBILE : INITIAL_DESKTOP;
  const step = isMobile ? STEP_MOBILE : STEP_DESKTOP;
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

  // При смене фильтров/сортировки/поиска или брейкпоинта — сбрасываем к initialCount
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [minPrice, maxPrice, sortParam, qParam, selectedColorKeys, initialCount]);

  const visibleFlowers = sortedFlowers.slice(0, visibleCount);
  const hasMore = sortedFlowers.length > visibleCount;

  // Вычисляем индекс элемента для предзагрузки
  // Desktop: когда видно ~20 товаров из 24 (5 строк из 6), начинаем загружать
  // Mobile: когда видно ~10 товаров из 12 (5 строк из 6), начинаем загружать
  const sentinelIndex = useMemo(() => {
    if (!hasMore || visibleCount === 0) return -1;
    // Размещаем sentinel примерно на 80% от visibleCount для предзагрузки
    // Desktop: 24 * 0.8 = ~19-20 (5-я строка из 6)
    // Mobile: 12 * 0.8 = ~9-10 (5-я строка из 6)
    return Math.max(Math.floor(visibleCount * 0.8), Math.floor(visibleCount * 0.7));
  }, [visibleCount, hasMore]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setVisibleCount((n) => n + step);
    setTimeout(() => {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }, 150);
  }, [hasMore, step]);

  // IntersectionObserver: отслеживаем элемент на позиции sentinelIndex для предзагрузки
  useEffect(() => {
    if (sentinelIndex < 0 || !hasMore || !gridRef.current) return;

    const gridElement = gridRef.current;
    const children = Array.from(gridElement.children);
    const sentinelElement = children[sentinelIndex] as HTMLElement;
    
    if (!sentinelElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || isLoadingRef.current) return;
        loadMore();
      },
      { rootMargin: "300px 0px", threshold: 0 }
    );

    observer.observe(sentinelElement);
    return () => observer.disconnect();
  }, [sentinelIndex, hasMore, loadMore]);

  return (
    <div>
      {/* Каталог: 2 колонки mobile, 4 на desktop; меньший gap — карточки крупнее */}
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {visibleFlowers.map((flower) => {
          // Находим соответствующий Product для передачи дополнительных данных
          const product = allProducts.find((p) => p.id === flower.id);
          return <FlowerCard key={flower.id} flower={flower} product={product} />;
        })}
      </div>

      {/* Индикатор загрузки */}
      {isLoadingMore && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-color-text-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-main)] border-t-transparent" />
            <span className="text-sm">Загрузка...</span>
          </div>
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
