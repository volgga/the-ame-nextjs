"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = {
  id: string;
  title?: string;
  imageUrl: string;
};

/**
 * HeroCarousel (упрощённая версия без embla/radix).
 *
 * Почему "use client":
 * - автопрокрутка (setInterval) и кнопки переключения — это браузерная логика.
 *
 * В оригинале слайды берутся из Supabase через `useHeroSlides`.
 * Здесь временно используем статические картинки с сайта (remote), чтобы UI был похож.
 * Позже заменим на SSR-загрузку слайдов.
 */
export function HeroCarousel() {
  const slides: Slide[] = useMemo(
    () => [
      { id: "1", title: "Сезонная коллекция", imageUrl: "https://theame.ru/roses.jpg" },
      { id: "2", title: "Букеты недели", imageUrl: "https://theame.ru/peonies.jpg" },
      { id: "3", title: "Композиции", imageUrl: "https://theame.ru/hydrangeas.jpg" },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const AUTOPLAY_MS = 4500;

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  const current = slides[index];

  return (
    <section className="relative isolate bg-[#fff8ea] py-6 md:py-8">
      <div className="relative z-10">
        <div className="w-full flex items-center justify-center">
          <div className="relative w-[96%] md:w-[94%] lg:w-[92%] h-[46vh] md:h-[54vh] lg:h-[60vh] max-h-[820px] rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
            <div className="absolute inset-0 rounded-3xl overflow-hidden bg-[#ece9e2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.imageUrl}
                alt={current.title ?? "Слайд"}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
              {/* Затемнение поверх изображения для читаемости текста */}
              <div className="absolute inset-0 bg-black/30" aria-hidden />
            </div>

            {/* Текст по центру */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center px-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">
                  Доставка, которой доверяют за 45 минут
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 drop-shadow-md">
                  в любую точку Сочи
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Предыдущий слайд"
          className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 z-20 rounded-full w-10 h-10 md:w-12 md:h-12 
                     bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                     border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#819570]/40"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Следующий слайд"
          className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 z-20 rounded-full w-10 h-10 md:w-12 md:h-12 
                     bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                     border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#819570]/40"
        >
          ›
        </button>
      </div>
    </section>
  );
}

