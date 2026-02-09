"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FlowerCard } from "@/components/catalog/FlowerCard";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import type { Product } from "@/lib/products";
import type { Flower } from "@/types/flower";

type AddToOrderSectionProps = {
  products: Product[];
};

/** Преобразование Product → Flower (как в RecommendSection / FlowerCatalog) */
function productsToFlowers(products: Product[]): Flower[] {
  return products.map((p) => {
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
  });
}

const AUTO_SCROLL_INTERVAL_MS = 5000;
const INTERACTION_PAUSE_MS = 10000;

/**
 * Блок «Хотите добавить к заказу?» под карточкой товара.
 * Горизонтальный бесконечный скролл в две строки; логика скролла как у «Рекомендуем».
 */
export function AddToOrderSection({ products }: AddToOrderSectionProps) {
  const flowers = useMemo(() => productsToFlowers(products), [products]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const userInteractionUntilRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    setScrollProgress(progress);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);
  }, []);

  const pauseAutoScroll = useCallback(() => {
    userInteractionUntilRef.current = Date.now() + INTERACTION_PAUSE_MS;
  }, []);

  const handleUserScroll = useCallback(() => {
    if (!isProgrammaticScrollRef.current) {
      pauseAutoScroll();
    }
  }, [pauseAutoScroll]);

  const handleInteraction = useCallback(() => {
    pauseAutoScroll();
  }, [pauseAutoScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    const handleScroll = () => updateScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", handleScroll);
    };
  }, [updateScrollState, flowers.length]);

  useEffect(() => {
    if (!scrollRef.current || flowers.length <= 1) return;
    const tick = () => {
      const now = Date.now();
      if (now < userInteractionUntilRef.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      if (maxScroll <= 0) return;
      const step = 340;
      const nextScroll = Math.min(scrollLeft + step, maxScroll);
      isProgrammaticScrollRef.current = true;
      if (nextScroll >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollTo({ left: nextScroll, behavior: "smooth" });
      }
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    };
    const id = setInterval(tick, AUTO_SCROLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [flowers.length]);

  const scrollBy = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      pauseAutoScroll();
      isProgrammaticScrollRef.current = true;
      const step = 580;
      const delta = direction === "left" ? -step : step;
      el.scrollBy({ left: delta, behavior: "smooth" });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    },
    [pauseAutoScroll]
  );

  if (!products.length) return null;

  // Колонки по два товара: [0,1], [2,3], [4,5] — в две строки
  const columns: [Flower | null, Flower | null][] = [];
  for (let i = 0; i < flowers.length; i += 2) {
    const top = flowers[i] ?? null;
    const bottom = flowers[i + 1] ?? null;
    columns.push([top, bottom]);
  }

  return (
    <section className={`bg-page-bg pb-12 md:pb-16 ${MAIN_PAGE_BLOCK_GAP}`} aria-labelledby="add-to-order-heading">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
          <h2
            id="add-to-order-heading"
            className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] uppercase tracking-tight"
          >
            Хотите добавить к заказу?
          </h2>
        </div>

        <div className="flex justify-end -mx-4 px-4 md:-mx-6 md:px-6 mb-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-outline-border)] bg-transparent text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
              aria-label="Прокрутить влево"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-outline-border)] bg-transparent text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
              aria-label="Прокрутить вправо"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onPointerDown={handleInteraction}
          onWheel={handleInteraction}
          onMouseEnter={handleInteraction}
          onScroll={handleUserScroll}
          className="flex gap-5 md:gap-6 overflow-x-auto overflow-y-hidden py-2 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-hide"
          style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        >
          {columns.map(([top, bottom], colIndex) => (
            <div
              key={colIndex}
              className="flex-shrink-0 flex flex-col gap-4 md:gap-5 w-[260px] sm:w-[280px] md:w-[300px] lg:w-[320px]"
            >
              {top && (
                <div className="flex-shrink-0">
                  <FlowerCard flower={top} product={products.find((p) => p.id === top.id)} showNewBadge={false} />
                </div>
              )}
              {bottom && (
                <div className="flex-shrink-0">
                  <FlowerCard flower={bottom} product={products.find((p) => p.id === bottom.id)} showNewBadge={false} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="mt-6 h-0.5 w-full bg-[rgba(31,42,31,0.12)] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Позиция прокрутки карусели"
        >
          <div
            className="h-full bg-[var(--color-text-main)] transition-transform duration-150 ease-out"
            style={{ width: "100%", transform: `scaleX(${scrollProgress})`, transformOrigin: "left" }}
          />
        </div>
      </div>
    </section>
  );
}
