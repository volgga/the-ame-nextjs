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

  // При смене фильтров/сортировки/поиска — сбрасываем к initialCount
  // НЕ включаем initialCount в зависимости, чтобы не сбрасывать при изменении брейкпоинта
  useEffect(() => {
    const currentInitial = isMobile ? INITIAL_MOBILE : INITIAL_DESKTOP;
    setVisibleCount(currentInitial);
  }, [minPrice, maxPrice, sortParam, qParam, selectedColorKeys, isMobile]);

  const visibleFlowers = sortedFlowers.slice(0, visibleCount);
  const hasMore = sortedFlowers.length > visibleCount;

  // Debug logging (только в dev режиме)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[FlowerCatalog] State update:", {
        totalProducts: allProducts.length,
        totalFiltered: sortedFlowers.length,
        visibleCount,
        hasMore,
        step,
      });
    }
  }, [allProducts.length, sortedFlowers.length, visibleCount, hasMore, step]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) {
      if (process.env.NODE_ENV === "development") {
        console.log("[FlowerCatalog] loadMore skipped:", { isLoading: isLoadingRef.current, hasMore });
      }
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[FlowerCatalog] loadMore called:", { currentCount: visibleCount, step, total: sortedFlowers.length });
    }
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setVisibleCount((n) => {
      const newCount = n + step;
      if (process.env.NODE_ENV === "development") {
        console.log("[FlowerCatalog] visibleCount updated:", { from: n, to: newCount });
      }
      return newCount;
    });
    setTimeout(() => {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }, 150);
  }, [hasMore, step, visibleCount, sortedFlowers.length]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: отслеживаем sentinel элемент для предзагрузки
  useEffect(() => {
    if (!hasMore) {
      if (process.env.NODE_ENV === "development") {
        console.log("[FlowerCatalog] Observer not set up: hasMore=false");
      }
      return;
    }

    // Небольшая задержка для того, чтобы DOM успел обновиться
    const timeoutId = setTimeout(() => {
      if (!sentinelRef.current) {
        if (process.env.NODE_ENV === "development") {
          console.log("[FlowerCatalog] Observer not set up: sentinelRef.current is null after timeout");
        }
        return;
      }

      const sentinelElement = sentinelRef.current;
      
      // Проверяем, виден ли sentinel уже сейчас
      const rect = sentinelElement.getBoundingClientRect();
      const isAlreadyVisible = rect.top < window.innerHeight + 800;
      
      if (process.env.NODE_ENV === "development") {
        console.log("[FlowerCatalog] Sentinel check:", {
          top: rect.top,
          windowHeight: window.innerHeight,
          isAlreadyVisible,
          isLoading: isLoadingRef.current,
        });
      }

      if (isAlreadyVisible && !isLoadingRef.current) {
        if (process.env.NODE_ENV === "development") {
          console.log("[FlowerCatalog] Sentinel already visible, triggering loadMore immediately");
        }
        loadMore();
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[FlowerCatalog] Setting up IntersectionObserver");
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (process.env.NODE_ENV === "development") {
            console.log("[FlowerCatalog] IntersectionObserver callback:", {
              isIntersecting: entry.isIntersecting,
              isLoading: isLoadingRef.current,
              hasMore,
            });
          }
          if (!entry.isIntersecting || isLoadingRef.current) return;
          if (process.env.NODE_ENV === "development") {
            console.log("[FlowerCatalog] Triggering loadMore from IntersectionObserver");
          }
          loadMore();
        },
        // Большой rootMargin для предзагрузки: начинаем загружать когда sentinel еще далеко внизу
        // Desktop: 4 колонки, ~20 товаров = 5 строк, примерно 1000-1200px вниз
        // Mobile: 2 колонки, ~10 товаров = 5 строк, примерно 800-1000px вниз
        { rootMargin: "800px 0px", threshold: 0 }
      );

      observer.observe(sentinelElement);
      
      return () => {
        if (process.env.NODE_ENV === "development") {
          console.log("[FlowerCatalog] Cleaning up IntersectionObserver");
        }
        observer.disconnect();
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasMore, loadMore]);

  // Проверка при монтировании и изменении visibleCount: если все товары уже видны, загружаем больше
  useEffect(() => {
    if (!hasMore || !gridRef.current || isLoadingRef.current) return;

    const checkVisibility = () => {
      const gridElement = gridRef.current;
      if (!gridElement) return;

      const children = Array.from(gridElement.children);
      if (children.length === 0) return;

      // Проверяем последний видимый элемент
      const lastElement = children[children.length - 1] as HTMLElement;
      if (!lastElement) return;

      const rect = lastElement.getBoundingClientRect();
      // Если последний элемент уже виден или близко к экрану (в пределах 800px) - загружаем
      const isLastVisible = rect.top < window.innerHeight + 800;

      if (process.env.NODE_ENV === "development") {
        console.log("[FlowerCatalog] Visibility check:", {
          childrenCount: children.length,
          lastElementTop: rect.top,
          windowHeight: window.innerHeight,
          isLastVisible,
          isLoading: isLoadingRef.current,
        });
      }

      if (isLastVisible && !isLoadingRef.current) {
        if (process.env.NODE_ENV === "development") {
          console.log("[FlowerCatalog] Triggering loadMore from visibility check");
        }
        loadMore();
      }
    };

    // Проверяем сразу и после небольшой задержки для надежности
    checkVisibility();
    const timeoutId = setTimeout(checkVisibility, 200);
    const timeoutId2 = setTimeout(checkVisibility, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [visibleCount, hasMore, loadMore]);

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

      {/* Sentinel элемент для предзагрузки - размещаем после grid */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-1 w-full"
          aria-hidden="true"
          style={{ minHeight: "1px" }}
          data-sentinel="true"
        />
      )}
      
      {/* Debug info (только в dev режиме) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 text-xs text-gray-500 p-2 bg-gray-100 rounded">
          Debug: visible={visibleCount} / total={sortedFlowers.length} / hasMore={hasMore ? "yes" : "no"}
        </div>
      )}

      {/* Индикатор загрузки */}
      {isLoadingMore && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-color-text-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-main)] border-t-transparent" />
            <span className="text-sm">Загрузка...</span>
          </div>
        </div>
      )}

      {/* Кнопка "Показать еще" как fallback */}
      {hasMore && !isLoadingMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              if (process.env.NODE_ENV === "development") {
                console.log("[FlowerCatalog] Manual loadMore triggered");
              }
              loadMore();
            }}
            className="rounded-full border border-[var(--color-outline-border)] bg-white px-6 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
          >
            Показать ещё ({sortedFlowers.length - visibleCount} товаров)
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
