"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FlowerCard } from "./FlowerCard";
import { Flower } from "@/types/flower";
import type { Product } from "@/lib/products";

type SortValue = "default" | "price_asc" | "price_desc";

/**
 * FlowerCatalog — каталог товаров с серверной пагинацией или автодогрузкой.
 * Если singlePage=true: показывает все товары с автодогрузкой при скролле.
 * Иначе: серверная пагинация с кнопкой "Показать ещё".
 */
type FlowerCatalogProps = {
  products: Product[];
  total: number;
  currentPage: number;
  pageSize: number;
  singlePage?: boolean; // Если true — автодогрузка вместо пагинации
};

export const FlowerCatalog = ({ products: allProducts, total, currentPage, pageSize, singlePage = false }: FlowerCatalogProps) => {
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

  // Для singlePage режима: управление видимыми товарами
  const [visibleCount, setVisibleCount] = useState(() => {
    // Определяем STEP на основе размера экрана (12 на мобиле, 24 на десктопе)
    if (typeof window !== "undefined") {
      return window.innerWidth < 768 ? 12 : 24;
    }
    return 24;
  });
  const tickingRef = useRef(false);
  const stepRef = useRef(24);
  const sortedFlowersLengthRef = useRef(0);

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

  // Фильтрация по цене, поиску и цвету букета (применяется к текущей странице)
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

  // Обновляем ref с длиной отфильтрованного массива и ограничиваем visibleCount сверху
  useEffect(() => {
    if (singlePage) {
      sortedFlowersLengthRef.current = sortedFlowers.length;
      // Если visibleCount больше чем доступно товаров после фильтрации - ограничиваем
      setVisibleCount((prev) => Math.min(prev, sortedFlowers.length));
    }
  }, [singlePage, sortedFlowers.length]);

  // Обновляем STEP при изменении размера экрана (без сброса visibleCount)
  useEffect(() => {
    if (!singlePage) return;
    
    const updateStep = () => {
      const isMobile = window.innerWidth < 768;
      stepRef.current = isMobile ? 12 : 24;
      // Clamp visibleCount вверх если нужно, но не сбрасываем вниз
      setVisibleCount((prev) => {
        const newStep = stepRef.current;
        const maxCount = sortedFlowersLengthRef.current;
        if (prev < newStep) {
          return Math.min(newStep, maxCount);
        }
        return prev;
      });
    };

    updateStep();
    window.addEventListener("resize", updateStep);
    return () => window.removeEventListener("resize", updateStep);
  }, [singlePage]);

  // Scroll listener для автодогрузки (только для singlePage)
  useEffect(() => {
    if (!singlePage) return;

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        tickingRef.current = false;

        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;
        const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

        // Порог: 1200px до низа
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
  }, [singlePage]);

  // Для singlePage: показываем только первые visibleCount товаров
  // Для обычного режима: показываем все товары текущей страницы
  const visibleFlowers = singlePage ? sortedFlowers.slice(0, visibleCount) : sortedFlowers;

  // Вычисляем есть ли следующая страница (только для обычного режима)
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = !singlePage && currentPage < totalPages;
  const nextPage = currentPage + 1;

  // Формируем URL для следующей страницы с сохранением всех query параметров
  const buildNextPageUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `${pathname}?${params.toString()}`;
  };

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
          total: {total} | currentPage: {currentPage} | pageSize: {pageSize} | totalPages: {totalPages} | rendered: {visibleFlowers.length} | filtered: {sortedFlowers.length}
        </div>
      )}

      {/* Кнопка "Показать ещё" */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Link
            href={buildNextPageUrl()}
            className="rounded-full border border-[var(--color-outline-border)] bg-white px-6 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
          >
            Показать ещё {total - currentPage * pageSize > 0 ? `(${total - currentPage * pageSize} товаров)` : ""}
          </Link>
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
