"use client";

import Link from "next/link";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import type { HomeReviews } from "@/lib/homeReviews";

type ReviewsSectionProps = {
  reviews: HomeReviews;
};

/**
 * Секция "Отзывы клиентов" — карточки отзывов.
 * На мобильном: горизонтальный скролл, на десктопе: сетка из 3 колонок.
 */
export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const ratingText = `на основе ${reviews.ratingCount} оценок`;
  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP}`}
      aria-labelledby="reviews-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Разделительная линия над секцией */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-baseline md:justify-between md:gap-4">
            <h2
              id="reviews-heading"
              className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] uppercase tracking-tight"
            >
              ОТЗЫВЫ КЛИЕНТОВ
            </h2>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                href="https://2gis.ru/sochi/firm/70000001098591027/tab/reviews?m=39.738377%2C43.615292%2F17.69"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 shrink-0"
              >
                → 2ГИС
              </Link>
              <Link
                href="https://yandex.ru/maps/org/the_ame/77269998905/reviews/?ll=39.734780%2C43.616071&z=16.49"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 shrink-0"
              >
                → ЯНДЕКС
              </Link>
            </div>
          </div>
        </div>
        {/* На мобильном: горизонтальный скролл, на десктопе: сетка из 3 колонок */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible overflow-y-hidden py-2 md:py-0 pb-2 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide">
          {/* Карточка №1: Рейтинг */}
          <div className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-auto bg-header-bg rounded-xl p-5 md:p-6">
            <div className="mb-4">
              <div className="text-header-foreground text-xl md:text-2xl mb-3">★★★★★</div>
              <div className="text-base md:text-lg text-header-foreground mb-1">5.0 на Яндекс.Картах</div>
              <div className="text-base md:text-lg text-header-foreground mb-4">5.0 на 2ГИС</div>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-baseline gap-3">
                <div className="text-6xl md:text-7xl font-bold text-header-foreground">5.0</div>
                <div className="text-2xl md:text-3xl font-bold text-header-foreground">Яндекс</div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl md:text-7xl font-bold text-header-foreground">5.0</div>
                <div className="text-2xl md:text-3xl font-bold text-header-foreground">2ГИС</div>
              </div>
            </div>
            <div className="text-base md:text-lg text-header-foreground">{ratingText}</div>
          </div>

          {/* Карточка №2: Отзыв */}
          <div className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-auto bg-header-bg rounded-xl p-5 md:p-6">
            <p className="text-sm md:text-base text-header-foreground leading-relaxed">
              {reviews.review2Text}
            </p>
          </div>

          {/* Карточка №3: Отзыв с эмодзи */}
          <div className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-auto bg-header-bg rounded-xl p-5 md:p-6">
            <p className="text-sm md:text-base text-header-foreground leading-relaxed">
              {reviews.review3Text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
