"use client";

import { useEffect, useRef, useState } from "react";
import { MAIN_PAGE_BLOCK_GAP } from "@/components/ui/breadcrumbs";

const YANDEX_MAP_SRC = "https://yandex.ru/map-widget/v1/?z=16&ol=biz&oid=77269998905";

/**
 * Секция "Карта" — iframe Яндекс.Карты подгружается только при появлении в viewport.
 * Экономит ~248 KiB JS + ~70 KiB CSS и откладывает сторонние cookie до скролла (Lighthouse: неиспользуемый JS/CSS, payload, cookie).
 * Высота: 280px на мобильном, 360px на десктопе.
 */
export function MapSection() {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShouldLoadMap(true);
      },
      { rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP} mb-8`}
      aria-label="Карта расположения"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className="w-full rounded-xl overflow-hidden border border-[var(--color-outline-border)] h-[280px] md:h-[360px] bg-[#ece9e2]">
          {shouldLoadMap ? (
            <iframe
              src={YANDEX_MAP_SRC}
              width="100%"
              height="100%"
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Карта расположения The Ame"
              allowFullScreen
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)] text-sm"
              aria-hidden
            >
              Загрузка карты…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
