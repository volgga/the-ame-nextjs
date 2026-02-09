"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { FlowerCard } from "@/components/catalog/FlowerCard";
import { MAIN_PAGE_BLOCK_GAP } from "@/components/ui/breadcrumbs";
import type { Product } from "@/lib/products";
import type { Flower } from "@/types/flower";

type RecommendSectionProps = {
  products: Product[];
};

/** Преобразование Product → Flower (как в FlowerCatalog) */
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
 * Блок «РЕКОМЕНДУЕМ» — горизонтальная карусель товаров из категории «Популярное».
 * Референс: flowerna.ru (секция RECOMMEND).
 * Кнопки стрелок, автоскролл, прогресс-бар, переиспользование FlowerCard.
 */
export function RecommendSection({ products }: RecommendSectionProps) {
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

    const handleScroll = () => {
      updateScrollState();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", handleScroll);
    };
  }, [updateScrollState, flowers.length]);

  // Автоскролл каждые 5 сек; пауза 10 сек при взаимодействии
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

      // Шаг ~1 карточка (320px + gap)
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
      // Прокрутка на 1–2 карточки (~580px)
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

  return (
    <section className={`bg-page-bg pb-12 md:pb-16 ${MAIN_PAGE_BLOCK_GAP}`} aria-labelledby="recommend-heading">
      <div className="container mx-auto px-4 md:px-6">
        {/* Разделительная линия над секцией */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        {/* headerRow: на мобильной заголовок сверху, затем одна строка [кнопка СМОТРЕТЬ ВСЕ | стрелки]; на md+ как раньше */}
        <div className="mb-2 md:mb-8">
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between md:gap-4 md:items-baseline">
            <h2
              id="recommend-heading"
              className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] uppercase tracking-tight shrink-0 min-w-0"
            >
              Рекомендуем
            </h2>
            {/* На md+: кнопка в одной строке с заголовком */}
            <Link
              href="/magazin"
              className="hidden md:inline-flex items-center gap-1.5 shrink-0 rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium uppercase tracking-tight text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
            >
              <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="whitespace-nowrap">СМОТРЕТЬ ВСЕ</span>
            </Link>
          </div>
          {/* Mobile only: кнопка и стрелки в одной строке под заголовком */}
          <div className="flex md:hidden flex-row items-center justify-between gap-2 mt-0 w-full">
            <Link
              href="/magazin"
              className="inline-flex items-center gap-1 shrink-0 rounded-full border border-[var(--color-outline-border)] bg-transparent px-2.5 py-1.5 text-xs font-medium uppercase tracking-tight text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
            >
              <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="whitespace-nowrap">СМОТРЕТЬ ВСЕ</span>
            </Link>
            <div className="flex items-center gap-0.5 shrink-0">
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
        </div>

        {/* md+: стрелки над каруселью (визуально над карточками) */}
        <div className="hidden md:flex justify-end -mx-4 px-4 md:-mx-6 md:px-6 mb-2">
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

        {/* carousel: на мобильной меньше отступ сверху */}
        <div
          ref={scrollRef}
          onPointerDown={handleInteraction}
          onWheel={handleInteraction}
          onMouseEnter={handleInteraction}
          onScroll={handleUserScroll}
          className="flex gap-5 md:gap-6 overflow-x-auto overflow-y-hidden py-0 md:py-2 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-hide"
          style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        >
          {flowers.map((flower) => {
            const product = products.find((p) => p.id === flower.id);
            return (
              <div key={flower.id} className="flex-shrink-0 w-[230px] sm:w-[280px] md:w-[300px] lg:w-[320px]">
                <FlowerCard flower={flower} product={product} />
              </div>
            );
          })}
        </div>

        {/* Прогресс-бар позиции скролла */}
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
