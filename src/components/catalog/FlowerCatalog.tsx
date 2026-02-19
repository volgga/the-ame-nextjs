"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FlowerCard } from "./FlowerCard";
import { Flower } from "@/types/flower";
import type { Product } from "@/lib/products";
import { getEffectivePrice, isDiscountActive } from "@/lib/priceUtils";

type SortValue = "default" | "price_asc" | "price_desc";

/**
 * FlowerCatalog — каталог товаров с infinite scroll.
 * Если singlePage=true или передан allProductsForInfiniteScroll: подгрузка при скролле (IntersectionObserver).
 * Кнопки "Показать ещё" нет — только infinite scroll.
 */
type FlowerCatalogProps = {
  products: Product[];
  total: number;
  currentPage: number;
  pageSize: number;
  singlePage?: boolean;
  /** Полный список товаров для infinite scroll (desktop + mobile) */
  allProductsForInfiniteScroll?: Product[];
};

export const FlowerCatalog = ({ products, total, currentPage, pageSize, singlePage = false, allProductsForInfiniteScroll }: FlowerCatalogProps) => {
  const pathname = usePathname();

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

  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768 ? 12 : 24;
    }
    return 24;
  });
  const tickingRef = useRef(false);
  const stepRef = useRef(24);
  const sortedFlowersLengthRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const useInfiniteScrollMode = singlePage || !!allProductsForInfiniteScroll?.length;

  const productsBase = allProductsForInfiniteScroll ?? products;

  // Преобразуем Product[] в Flower[] (price = эффективная цена; originalPrice = базовая при скидке)
  const flowers: Flower[] = useMemo(
    () =>
      productsBase.map((p) => {
        const hasVariants = p.variants && p.variants.length > 0;
        let price: number;
        let originalPrice: number | null = null;
        let discountPercent: number | null = null;
        if (hasVariants) {
          const effectivePrices = p.variants!.map((v) => getEffectivePrice(v));
          const basePrices = p.variants!.map((v) => v.price);
          price = Math.min(...effectivePrices);
          const minBase = Math.min(...basePrices);
          if (price < minBase) {
            originalPrice = minBase;
            const withDiscount = p.variants!.filter((v) => isDiscountActive(v));
            if (withDiscount.length > 0) discountPercent = withDiscount[0].discountPercent ?? null;
          }
        } else {
          price = getEffectivePrice(p);
          if (isDiscountActive(p)) {
            originalPrice = p.price;
            discountPercent = p.discountPercent ?? null;
          }
        }
        const priceFrom = hasVariants || p.id.startsWith("vp-");
        return {
          id: p.id,
          name: p.title,
          price,
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
          originalPrice: originalPrice ?? undefined,
          discountPercent: discountPercent ?? undefined,
        };
      }),
    [productsBase]
  );

  // Фильтрация по цене, поиску и цвету букета
  const filteredFlowers = useMemo(() => {
    return flowers.filter((flower) => {
      const price = flower.price ?? 0;
      if (!(price >= minPrice && price <= maxPrice)) return false;
      if (qParam && !(flower.name ?? "").toLowerCase().includes(qParam)) return false;
      if (selectedColorKeys.length > 0) {
        const product = productsBase.find((p) => p.id === flower.id);
        const productColors = product?.bouquetColors ?? [];
        const hasMatch = productColors.some((k) => selectedColorKeys.includes(k));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [flowers, productsBase, minPrice, maxPrice, qParam, selectedColorKeys]);

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

  // isMobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Обновляем ref с длиной и ограничиваем visibleCount.
  // При сбросе фильтров: если prev был мал (напр. 1), а список вырос — показываем минимум stepRef.current товаров.
  useEffect(() => {
    if (useInfiniteScrollMode) {
      const maxCount = sortedFlowers.length;
      sortedFlowersLengthRef.current = maxCount;
      setVisibleCount((prev) => {
        const step = stepRef.current;
        const capped = Math.min(prev, maxCount);
        if (maxCount >= step && capped < step) return Math.min(step, maxCount);
        return capped;
      });
    }
  }, [useInfiniteScrollMode, sortedFlowers.length]);

  // STEP при изменении размера
  useEffect(() => {
    if (!useInfiniteScrollMode) return;
    const updateStep = () => {
      const mobile = window.innerWidth < 768;
      stepRef.current = mobile ? 12 : 24;
      setVisibleCount((prev) => {
        const newStep = stepRef.current;
        const maxCount = sortedFlowersLengthRef.current;
        if (prev < newStep) return Math.min(newStep, maxCount);
        return prev;
      });
    };
    updateStep();
    window.addEventListener("resize", updateStep);
    return () => window.removeEventListener("resize", updateStep);
  }, [useInfiniteScrollMode]);

  // Scroll listener для singlePage (без sentinel) — fallback если IntersectionObserver не сработает
  useEffect(() => {
    if (!singlePage || useInfiniteScrollMode) return;
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const distanceToBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        const maxCount = sortedFlowersLengthRef.current;
        setVisibleCount((prev) => {
          if (distanceToBottom < 1200 && prev < maxCount) {
            return Math.min(prev + stepRef.current, maxCount);
          }
          return prev;
        });
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [singlePage, useInfiniteScrollMode]);

  // IntersectionObserver для infinite scroll (sentinel) — desktop + mobile
  useEffect(() => {
    if (!useInfiniteScrollMode) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (loadingRef.current) return;
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        const maxCount = sortedFlowersLengthRef.current;
        loadingRef.current = true;
        setVisibleCount((prev) => {
          const next = Math.min(prev + stepRef.current, maxCount);
          if (next === prev) loadingRef.current = false;
          return next;
        });
        setTimeout(() => { loadingRef.current = false; }, 100);
      },
      { rootMargin: "400px", threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [useInfiniteScrollMode]);

  // visibleFlowers
  const visibleFlowers = useInfiniteScrollMode
    ? sortedFlowers.slice(0, visibleCount)
    : sortedFlowers;


  return (
    <div>
      {/* Каталог: 2 колонки mobile, 4 на desktop; меньший gap — карточки крупнее */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {visibleFlowers.map((flower, index) => {
          const product = productsBase.find((p) => p.id === flower.id);
          return (
            <FlowerCard
              key={flower.id}
              flower={flower}
              product={product}
              imagePriority={index < 8}
            />
          );
        })}
      </div>

      {/* Debug info (только в dev режиме) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 text-xs text-gray-500 p-2 bg-gray-100 rounded">
          total: {total} | rendered: {visibleFlowers.length} | filtered: {sortedFlowers.length}
        </div>
      )}

      {/* Sentinel для infinite scroll (desktop + mobile) */}
      {useInfiniteScrollMode && visibleCount < sortedFlowers.length && (
        <div ref={sentinelRef} className="h-4 flex items-center justify-center py-4" aria-hidden>
          <div className="w-5 h-5 border-2 border-[var(--color-outline-border)] border-t-[var(--color-text-main)] rounded-full animate-spin" />
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
