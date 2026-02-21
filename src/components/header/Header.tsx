"use client";

import { useState, useEffect, useRef } from "react";
import { TopMarquee } from "./TopMarquee";
import { TopBar } from "./TopBar";
import { HeaderMain } from "./HeaderMain";
import { useHeaderScrollDirection } from "@/hooks/useHeaderScrollDirection";
import type { MarqueeSettings } from "@/lib/homeMarquee";

const MARQUEE_H = 28;
const MAIN_H = 44;
/** Фиксированная высота top bar — не зависящая от ResizeObserver, чтобы избежать layout shift при переносе строк/загрузке шрифтов */
const TOP_BAR_H = 44;
const TOPBAR_TRANSITION_MS = 360;
const TOPBAR_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Двухрядный хедер (top bar + main bar).
 * marquee — настройки бегущей дорожки (SSR). Если выключена или нет текста — блок не рендерится, хедер без отступа.
 */
export function Header({ marquee }: { marquee?: MarqueeSettings | null }) {
  const hasPhrases = Boolean(marquee?.phrases?.length);
  const marqueeVisible = Boolean(marquee?.enabled) && hasPhrases;
  const marqueeHeight = marqueeVisible ? MARQUEE_H : 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animationLockRef = useRef(false);
  const headerMode = useHeaderScrollDirection(animationLockRef);
  const isTopbarShown = headerMode === "expanded";

  const [isMdOrLarger, setIsMdOrLarger] = useState(true); // до гидратации — как на сервере
  const [mounted, setMounted] = useState(false);
  const topbarMaskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const m = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMdOrLarger(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, [mounted]);

  const handleTopbarMaskTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== topbarMaskRef.current || e.propertyName !== "height") return;
    animationLockRef.current = false;
  };

  const mainBarWrapperRef = useRef<HTMLDivElement>(null);
  const handleMainBarTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== mainBarWrapperRef.current) return;
    if (e.propertyName !== "height" && e.propertyName !== "transform") return;
    animationLockRef.current = false;
  };

  // Фиксированные высоты — без ResizeObserver, чтобы хедер не прыгал при смене ширины/шрифта
  const effectiveMdOrLarger = mounted ? isMdOrLarger : true;
  const topbarVisible = effectiveMdOrLarger && isTopbarShown;
  const topbarMaskHeight = topbarVisible ? `${TOP_BAR_H}px` : "0px";
  // На мобиле при скролле вниз скрываем основную строку; до mounted не скрываем (гидратация)
  const mainBarVisible = !mounted || effectiveMdOrLarger || headerMode === "expanded";
  const spacerHeight = marqueeHeight + (topbarVisible ? TOP_BAR_H : 0) + (mainBarVisible ? MAIN_H : 0);

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-40"
        style={{
          margin: 0,
          padding: 0,
          background: "transparent",
        }}
      >
        {marqueeVisible && marquee && (
          <div
            className="w-full relative z-10"
            style={{
              height: MARQUEE_H,
              margin: 0,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <TopMarquee phrases={marquee.phrases ?? []} href={marquee.link ?? undefined} speed={50} duplicates={6} />
          </div>
        )}

        {/* topbar-mask: скрыт на мобильных (sm), на md+ — фон topbar, анимируемая высота H <-> 0. */}
        <div className="hidden md:block">
          <div
            ref={topbarMaskRef}
            className="w-full bg-header-bg relative z-50"
            style={{
              height: topbarMaskHeight,
              margin: 0,
              padding: 0,
              overflow: "hidden",
              boxSizing: "border-box",
              transition: `height ${TOPBAR_TRANSITION_MS}ms ${TOPBAR_EASING}`,
            }}
            onTransitionEnd={handleTopbarMaskTransitionEnd}
          >
            <div
              className="w-full bg-header-bg"
              style={{
                transform: isTopbarShown ? "translateY(0)" : "translateY(-100%)",
                transition: `transform ${TOPBAR_TRANSITION_MS}ms ${TOPBAR_EASING}`,
                willChange: "transform",
                pointerEvents: isTopbarShown ? "auto" : "none",
              }}
            >
              <TopBar />
            </div>
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "1px",
                background: "var(--header-foreground)",
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* Основная строка (логотип, иконки): на мобиле hide-on-scroll, обёртка сжимается по высоте */}
        <div
          ref={mainBarWrapperRef}
          className="w-full bg-header-bg overflow-hidden md:overflow-visible"
          style={{
            height: mainBarVisible || effectiveMdOrLarger ? MAIN_H : 0,
            margin: 0,
            padding: 0,
            boxSizing: "border-box",
            transition: "height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onTransitionEnd={handleMainBarTransitionEnd}
        >
          <div
            className="w-full h-full flex items-center"
            style={{
              margin: 0,
              padding: 0,
              minHeight: MAIN_H,
              transform: mainBarVisible ? "translateY(0)" : "translateY(-100%)",
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform",
              pointerEvents: mainBarVisible ? "auto" : "none",
            }}
          >
            <HeaderMain isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} mainBarVisible={mainBarVisible} />
          </div>
        </div>
      </header>

      <div
        aria-hidden
        style={{
          height: spacerHeight,
          margin: 0,
          padding: 0,
          transition: `height ${TOPBAR_TRANSITION_MS}ms ${TOPBAR_EASING}`,
        }}
      />
    </>
  );
}
