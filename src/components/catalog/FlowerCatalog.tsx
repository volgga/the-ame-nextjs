"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FlowerCard } from "./FlowerCard";
import { Flower } from "@/types/flower";
import type { Product } from "@/lib/products";

/** Карточек в одном блоке автоподгрузки: mobile 12 рядов × 2 колонки = 24, desktop 6 рядов × 4 колонки = 24 */
const ROWS_MOBILE = 12;
const ROWS_DESKTOP = 6;
const COLS_MOBILE = 2;
const COLS_DESKTOP = 4;
const CARDS_PER_BLOCK_MOBILE = ROWS_MOBILE * COLS_MOBILE; // 24
const CARDS_PER_BLOCK_DESKTOP = ROWS_DESKTOP * COLS_DESKTOP; // 24

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
  /** Сколько блоков показываем: mobile — 12 рядов за блок, desktop — 6 рядов за блок; автоподгрузка добавляет один блок */
  const [visibleBlocks, setVisibleBlocks] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const sortParam = (searchParams.get("sort") as SortValue) ?? "default";
  const qParam = (searchParams.get("q") ?? "").trim().toLowerCase();

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

  // Фильтрация по цене и поиску
  const filteredFlowers = useMemo(() => {
    return flowers.filter((flower) => {
      const price = flower.price ?? 0;
      if (!(price >= minPrice && price <= maxPrice)) return false;
      if (qParam && !(flower.name ?? "").toLowerCase().includes(qParam)) return false;
      return true;
    });
  }, [flowers, minPrice, maxPrice, qParam]);

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

  // Карточек в одном блоке: mobile 12 рядов (24 карточки), desktop 6 рядов (24 карточки). Брейкпоинт md (768px).
  const [cardsPerBlock, setCardsPerBlock] = useState(CARDS_PER_BLOCK_MOBILE);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setCardsPerBlock(mq.matches ? CARDS_PER_BLOCK_DESKTOP : CARDS_PER_BLOCK_MOBILE);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // При смене фильтров/сортировки/поиска — сбрасываем к первому блоку (12 рядов на мобиле, 6 на desktop)
  useEffect(() => {
    setVisibleBlocks(1);
  }, [minPrice, maxPrice, sortParam, qParam]);

  // Показываем visibleBlocks блоков (mobile: 12 рядов за раз, desktop: 6 рядов за раз)
  const visibleCount = visibleBlocks * cardsPerBlock;
  const visibleFlowers = sortedFlowers.slice(0, visibleCount);
  const hasMore = sortedFlowers.length > visibleCount;

  // Функция для загрузки следующего блока
  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    // Имитация небольшой задержки для плавности (данные уже есть, просто рендер)
    setTimeout(() => {
      setVisibleBlocks((b) => b + 1);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }, 150);
  }, [hasMore]);

  // IntersectionObserver для автоподгрузки при скролле
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingRef.current && hasMore) {
          loadMore();
        }
      },
      {
        rootMargin: "600px", // Начинаем загрузку заранее (600px до появления sentinel)
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

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

      {/* Sentinel элемент для автоподгрузки при скролле */}
      {hasMore && <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />}

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
