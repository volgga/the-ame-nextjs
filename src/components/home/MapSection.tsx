"use client";

import { MAIN_PAGE_BLOCK_GAP } from "@/components/ui/breadcrumbs";

const YANDEX_MAP_SRC = "https://yandex.ru/map-widget/v1/?z=16&ol=biz&oid=77269998905";

/**
 * Секция "Карта" — iframe Яндекс.Карты на всю ширину контейнера.
 * Масштаб z=16 (~300 м вокруг точки). Высота: 280px на мобильном, 360px на десктопе.
 */
export function MapSection() {
  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP} mb-8`}
      aria-label="Карта расположения"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Разделительная линия над секцией */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className="w-full rounded-xl overflow-hidden border border-[var(--color-outline-border)] h-[280px] md:h-[360px]">
          <iframe
            src={YANDEX_MAP_SRC}
            width="100%"
            height="100%"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="Карта расположения The Ame"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
