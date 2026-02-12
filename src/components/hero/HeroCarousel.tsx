"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { HeroSlide } from "@/lib/heroSlides";
import { ChevronArrow } from "./ChevronArrow";

/** Fallback-слайды, если в БД пусто */
const FALLBACK_SLIDES: HeroSlide[] = [
  { id: "1", imageUrl: "https://theame.ru/roses.jpg", sort_order: 0 },
  { id: "2", imageUrl: "https://theame.ru/peonies.jpg", sort_order: 1 },
  { id: "3", imageUrl: "https://theame.ru/hydrangeas.jpg", sort_order: 2 },
];

function hasSlideButton(slide: HeroSlide): boolean {
  return Boolean(slide.buttonText?.trim() && slide.buttonHref?.trim());
}

function getAlignClass(align: HeroSlide["buttonAlign"]): string {
  if (align === "left" || align === "center" || align === "right") {
    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };
    return alignClasses[align];
  }
  return "justify-center";
}

const AUTOPLAY_MS = 5000;
const TRANSITION_MS = 800;
const TRANSITION_SAFETY_MS = TRANSITION_MS + 100; // Fallback timeout для сброса lock

type HeroCarouselProps = {
  slides?: HeroSlide[];
};

/**
 * HeroCarousel — слайды из Supabase (hero_slides) или fallback.
 * next/image обеспечивает оптимизацию (webp/avif, sizes) для быстрой загрузки.
 *
 * Высота хиро — стабильная на мобилке, без дёргания:
 * - mobile  (<768px):  clamp(420px, 60vh, 560px) — предсказуемая высота
 * - tablet  (768–1199): 420px
 * - laptop  (1200–1439): 500px
 * - desktop (≥1440px):  560px, max 680px
 */
export function HeroCarousel({ slides: propSlides }: HeroCarouselProps) {
  const slides = propSlides && propSlides.length > 0 ? propSlides : FALLBACK_SLIDES;

  // Дублируем слайды для бесшовного loop: [last, ...slides, first]
  const loopSlides = useMemo(() => {
    return slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;
  }, [slides]);
  const realIndexOffset = useMemo(() => (slides.length > 1 ? 1 : 0), [slides.length]);

  const [index, setIndex] = useState(realIndexOffset);
  const [isRevealActive, setIsRevealActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Lock для предотвращения повторных кликов во время анимации
  const isAnimatingRef = useRef(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Проверяем prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsRevealActive(true);
      return;
    }

    // Активируем reveal эффект после монтирования
    const timer = setTimeout(() => {
      setIsRevealActive(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Обработчик завершения transition для сброса lock
  useEffect(() => {
    const container = slideContainerRef.current;
    if (!container) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      // Проверяем, что это transition для transform (анимация слайда)
      if (e.propertyName === "transform" && isAnimatingRef.current) {
        isAnimatingRef.current = false;
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
          transitionTimeoutRef.current = null;
        }
      }
    };

    container.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      container.removeEventListener("transitionend", handleTransitionEnd);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Автопрокрутка с бесшовным loop
  useEffect(() => {
    if (slides.length <= 1) return;

    const totalSlides = loopSlides.length;
    const t = window.setInterval(() => {
      // Пропускаем автопрокрутку, если идет анимация от клика пользователя
      if (isAnimatingRef.current) return;

      // Устанавливаем lock для автопрокрутки
      isAnimatingRef.current = true;

      // Fallback timeout для сброса lock
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
        transitionTimeoutRef.current = null;
      }, TRANSITION_SAFETY_MS);

      setIndex((i) => {
        const next = i + 1;
        // Если дошли до последнего (дубликат первого), ждём окончания анимации и перепрыгиваем на оригинал без анимации
        if (next >= totalSlides - 1) {
          // Ждём завершения transition перед перепрыгиванием
          setTimeout(() => {
            setIsTransitioning(false);
            requestAnimationFrame(() => {
              setIndex(realIndexOffset);
              requestAnimationFrame(() => {
                setIsTransitioning(true);
                // Сбрасываем lock после перепрыгивания
                isAnimatingRef.current = false;
                if (transitionTimeoutRef.current) {
                  clearTimeout(transitionTimeoutRef.current);
                  transitionTimeoutRef.current = null;
                }
              });
            });
          }, TRANSITION_MS);
          return next;
        }
        return next;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [slides.length, loopSlides.length, realIndexOffset]);

  const prev = useCallback(() => {
    if (slides.length <= 1) return;

    // Блокируем повторные клики во время анимации
    if (isAnimatingRef.current) return;

    const totalSlides = loopSlides.length;

    // Устанавливаем lock
    isAnimatingRef.current = true;

    // Fallback timeout для сброса lock (на случай если transitionend не сработает)
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      transitionTimeoutRef.current = null;
    }, TRANSITION_SAFETY_MS);

    setIndex((i) => {
      const next = i - 1;
      // Если дошли до первого (дубликат последнего), ждём окончания анимации и перепрыгиваем на оригинал без анимации
      if (next < realIndexOffset) {
        // Ждём завершения transition перед перепрыгиванием
        setTimeout(() => {
          setIsTransitioning(false);
          requestAnimationFrame(() => {
            setIndex(totalSlides - 2);
            requestAnimationFrame(() => {
              setIsTransitioning(true);
              // Сбрасываем lock после перепрыгивания
              isAnimatingRef.current = false;
              if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
                transitionTimeoutRef.current = null;
              }
            });
          });
        }, TRANSITION_MS);
        return next;
      }
      return next;
    });
  }, [slides.length, loopSlides.length, realIndexOffset]);

  const next = useCallback(() => {
    if (slides.length <= 1) return;

    // Блокируем повторные клики во время анимации
    if (isAnimatingRef.current) return;

    const totalSlides = loopSlides.length;

    // Устанавливаем lock
    isAnimatingRef.current = true;

    // Fallback timeout для сброса lock (на случай если transitionend не сработает)
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      transitionTimeoutRef.current = null;
    }, TRANSITION_SAFETY_MS);

    setIndex((i) => {
      const next = i + 1;
      // Если дошли до последнего (дубликат первого), ждём окончания анимации и перепрыгиваем на оригинал без анимации
      if (next >= totalSlides - 1) {
        // Ждём завершения transition перед перепрыгиванием
        setTimeout(() => {
          setIsTransitioning(false);
          requestAnimationFrame(() => {
            setIndex(realIndexOffset);
            requestAnimationFrame(() => {
              setIsTransitioning(true);
              // Сбрасываем lock после перепрыгивания
              isAnimatingRef.current = false;
              if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
                transitionTimeoutRef.current = null;
              }
            });
          });
        }, TRANSITION_MS);
        return next;
      }
      return next;
    });
  }, [slides.length, loopSlides.length, realIndexOffset]);

  const btnBase =
    "absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] text-white transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

  return (
    <section className="relative hero-full-width bg-[#fff8ea] overflow-hidden pb-4 md:pb-6 -mx-0.5 md:-mx-8">
      <div className="relative w-full h-[clamp(420px,60vh,560px)] min-[768px]:h-[420px] min-[1200px]:h-[500px] min-[1440px]:h-[560px] min-[1440px]:max-h-[680px]">
        <div
          className={`absolute inset-0 overflow-hidden bg-[#ece9e2] hero-reveal ${isRevealActive ? "hero-reveal--active" : ""}`}
        >
          <div
            ref={slideContainerRef}
            className="flex h-full min-h-0 transition-transform ease-in-out"
            style={{
              width: `${loopSlides.length * 100}%`,
              transform: `translateX(-${index * (100 / loopSlides.length)}%)`,
              transitionDuration: isTransitioning ? `${TRANSITION_MS}ms` : "0ms",
            }}
          >
            {loopSlides.map((slide, i) => (
              <div
                key={`${slide.id}-${i}`}
                className="relative flex-shrink-0 w-full h-full"
                style={{ width: `${100 / loopSlides.length}%` }}
              >
                <Image
                  src={slide.imageUrl}
                  alt="Слайд"
                  fill
                  className="object-cover object-center select-none pointer-events-none"
                  loading={i === realIndexOffset ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 1600px, 1920px"
                  quality={90}
                  priority={i === realIndexOffset}
                />
                {hasSlideButton(slide) && slide.buttonHref && slide.buttonText && (
                  <div
                    className={`absolute inset-x-0 bottom-0 flex items-center px-4 pb-4 min-[768px]:px-8 min-[768px]:pb-8 z-10 ${getAlignClass(slide.buttonAlign)}`}
                  >
                    <Link
                      href={slide.buttonHref}
                      className={
                        slide.buttonVariant === "transparent"
                          ? "rounded-lg px-5 py-2.5 min-[768px]:px-6 min-[768px]:py-3 text-[clamp(0.875rem,2.5vw,1rem)] font-medium leading-snug min-h-[44px] min-w-[44px] inline-flex items-center justify-center border-2 border-white text-white bg-transparent hover:bg-white/10 transition max-w-[min(calc(100vw-2rem),22rem)] break-words text-center"
                          : "rounded-lg px-5 py-2.5 min-[768px]:px-6 min-[768px]:py-3 text-[clamp(0.875rem,2.5vw,1rem)] font-medium leading-snug min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-accent-btn text-white border-0 hover:bg-accent-btn-hover active:bg-accent-btn-active transition max-w-[min(calc(100vw-2rem),22rem)] break-words text-center"
                      }
                    >
                      {slide.buttonText}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={prev} aria-label="Предыдущий слайд" className={`left-6 sm:left-8 ${btnBase}`}>
          <ChevronArrow direction="left" />
        </button>
        <button type="button" onClick={next} aria-label="Следующий слайд" className={`right-6 sm:right-8 ${btnBase}`}>
          <ChevronArrow direction="right" />
        </button>
      </div>
    </section>
  );
}
