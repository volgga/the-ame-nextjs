"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/heroSlides";
import { ChevronArrow } from "./ChevronArrow";

/** Fallback-слайды, если в БД пусто */
const FALLBACK_SLIDES: HeroSlide[] = [
  { id: "1", imageUrl: "https://theame.ru/roses.jpg", sort_order: 0 },
  { id: "2", imageUrl: "https://theame.ru/peonies.jpg", sort_order: 1 },
  { id: "3", imageUrl: "https://theame.ru/hydrangeas.jpg", sort_order: 2 },
];

const AUTOPLAY_MS = 5000;
const TRANSITION_MS = 800;

type HeroCarouselProps = {
  slides?: HeroSlide[];
};

/**
 * HeroCarousel — слайды из Supabase (hero_slides) или fallback.
 * next/image обеспечивает оптимизацию (webp/avif, sizes) для быстрой загрузки.
 */
export function HeroCarousel({ slides: propSlides }: HeroCarouselProps) {
  const slides = (propSlides && propSlides.length > 0) ? propSlides : FALLBACK_SLIDES;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  const btnBase =
    "absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] text-white transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

  return (
    <section className="relative w-full bg-[#fff8ea] overflow-hidden pb-4 md:pb-6">
      <div className="relative w-full h-[75vh] min-h-[420px] sm:h-[78vh] md:h-[82vh] lg:h-[85vh] max-h-[1000px]">
        <div className="absolute inset-0 overflow-hidden bg-[#ece9e2]">
          <div
            className="flex h-full transition-transform ease-in-out"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(-${index * (100 / slides.length)}%)`,
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
          >
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="relative flex-shrink-0 w-full h-full"
                style={{ width: `${100 / slides.length}%` }}
              >
                <Image
                  src={slide.imageUrl}
                  alt="Слайд"
                  fill
                  className="object-cover select-none pointer-events-none"
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 1080px, (max-width: 1024px) 1600px, 1920px"
                  quality={90}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Предыдущий слайд"
          className={`left-6 sm:left-8 ${btnBase}`}
        >
          <ChevronArrow direction="left" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Следующий слайд"
          className={`right-6 sm:right-8 ${btnBase}`}
        >
          <ChevronArrow direction="right" />
        </button>
      </div>
    </section>
  );
}
