"use client";

import { useEffect, useRef, useState } from "react";
import { addImageCacheBust, imageUrlVersion } from "@/utils/imageUtils";
import { AppImage } from "@/components/ui/AppImage";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MAIN_PAGE_BLOCK_GAP } from "@/components/ui/breadcrumbs";
import type { HomeAbout } from "@/lib/homeAbout";

type AboutSectionProps = {
  about: HomeAbout;
};

/**
 * Секция "О нас" — два кубика в ряд: слева текст, справа квадратное фото.
 * Заголовок над гридом (как у Коллекции / Рекомендуем).
 * Адаптивно: на мобильном текст сверху, изображение снизу.
 */
export function AboutSection({ about }: AboutSectionProps) {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Разбиваем текст на параграфы по двойным переносам строк
  const text = about?.text || "";
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

  // SSR-safe: reveal-ready только после mount
  useEffect(() => {
    setIsReady(true);
  }, []);

  // IntersectionObserver: эффект появления при прокрутке (как у Коллекций)
  useEffect(() => {
    if (!isReady || !gridRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.25, rootMargin: "600px 0px" }
    );
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [isReady]);

  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP}`}
      aria-labelledby="about-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Разделительная линия над секцией */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        {/* Заголовок + кнопка: отступ заголовок→текст = отступ разделитель→заголовок (mb-6 md:mb-8) */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-baseline md:justify-between md:gap-4">
            <h2
              id="about-heading"
              className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)] uppercase tracking-tight"
            >
              {about?.title || "О нас"}
            </h2>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-full border border-[var(--color-outline-border)] bg-transparent px-4 py-2 text-sm font-medium uppercase tracking-tight text-[var(--color-text-main)] hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 shrink-0"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
              ПОДРОБНЕЕ О НАС
            </Link>
          </div>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 md:gap-5 items-start"
        >
          {/* Блок слева: текст */}
          <div
            className={`pl-0 pr-4 md:pr-5 lg:pr-6 pt-0 pb-4 md:pb-5 lg:pb-6 flex flex-col reveal reveal--stagger ${isVisible ? "reveal--in" : ""}`}
            style={{ "--stagger-delay": "0ms" } as React.CSSProperties}
          >
            <div className="flex-1 space-y-3 text-[var(--color-text-main)]">
              {paragraphs.map((paragraph, index) => {
                const key = paragraph.trim().slice(0, 20) || `para-${index}`;
                return (
                  <p key={key} className="text-sm md:text-base leading-normal">
                    {paragraph.trim()}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Справа: строго квадрат 1:1 (aspect-square), без привязки к высоте текста */}
          <div
            className={`group bg-white border border-border-block rounded-2xl p-0 overflow-hidden reveal reveal--stagger ${isVisible ? "reveal--in" : ""}`}
            style={{ "--stagger-delay": "160ms" } as React.CSSProperties}
          >
            {about?.imageUrl ? (
              <div className="relative aspect-square w-full overflow-hidden">
                {/* TODO: Добавить updated_at в HomeAbout (home_reviews) для cache-bust при смене фото */}
                <AppImage
                  src={addImageCacheBust(about.imageUrl, imageUrlVersion(about.imageUrl))}
                  alt={about?.title ? `Фото для блока «${about.title}»` : "The Ame — о нас"}
                  fill
                  variant="card"
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                  quality={75}
                  priority
                  loading="eager"
                  // TODO: Добавить imageData когда AboutSection будет иметь варианты изображений
                />
              </div>
            ) : (
              <div className="relative aspect-square w-full bg-gray-200" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
