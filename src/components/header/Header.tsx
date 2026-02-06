"use client";

import { useState, useEffect, useRef } from "react";
import { TopMarquee } from "./TopMarquee";
import { TopBar } from "./TopBar";
import { HeaderMain } from "./HeaderMain";
import { useHeaderScrollDirection } from "@/hooks/useHeaderScrollDirection";

const MARQUEE_H = 32;
const MAIN_H = 44;
const TOP_BAR_H_DEFAULT = 44;
const TOPBAR_TRANSITION_MS = 360;
const TOPBAR_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Двухрядный хедер (top bar + main bar).
 * При скрытии: topbar-mask схлопывается по высоте до 0 (фон и контент исчезают),
 * inner topbar дополнительно уезжает translateY(-100%). Main header поднимается на место topbar.
 * Spacer анимирует высоту, чтобы не было рывка контента.
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animationLockRef = useRef(false);
  const headerMode = useHeaderScrollDirection(animationLockRef);
  const isTopbarShown = headerMode === "expanded";

  const [topbarHeightPx, setTopbarHeightPx] = useState(TOP_BAR_H_DEFAULT);
  const [isMdOrLarger, setIsMdOrLarger] = useState(true); // до гидратации — как на сервере
  const [mounted, setMounted] = useState(false);
  const topBarMeasureRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const el = topBarMeasureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const h = el.scrollHeight;
      if (h > 0) setTopbarHeightPx(h);
    });
    ro.observe(el);
    if (el.scrollHeight > 0) setTopbarHeightPx(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  // До mounted используем те же значения, что и на сервере, чтобы не ломать гидратацию
  const effectiveMdOrLarger = mounted ? isMdOrLarger : true;
  const topbarVisible = effectiveMdOrLarger && isTopbarShown;
  const topbarMaskHeight = topbarVisible ? `${topbarHeightPx}px` : "0px";
  // На мобиле при скролле вниз скрываем основную строку; до mounted не скрываем (гидратация)
  const mainBarVisible =
    !mounted || effectiveMdOrLarger || headerMode === "expanded";
  const spacerHeight =
    MARQUEE_H + (topbarVisible ? topbarHeightPx : 0) + (mainBarVisible ? MAIN_H : 0);

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
        <div
          className="w-full relative z-10 bg-header-bg border-b border-header-foreground-secondary"
          style={{
            height: MARQUEE_H,
            margin: 0,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <TopMarquee
            phrases={["Один клик и ты герой 14 февраля"]}
            href="/magazine/14-fevralya"
            speed={50}
            duplicates={6}
          />
        </div>

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
              ref={topBarMeasureRef}
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
