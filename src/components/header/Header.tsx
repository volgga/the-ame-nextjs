"use client";

import { useState, useEffect, useRef } from "react";
import { TopMarquee } from "./TopMarquee";
import { TopBar } from "./TopBar";
import { HeaderMain } from "./HeaderMain";
import { useHeaderScrollDirection } from "@/hooks/useHeaderScrollDirection";

const MARQUEE_H = 32;
const MAIN_H = 44;
const TOP_BAR_H_DEFAULT = 44;
const HEADER_TRANSITION_MS = 250;

/**
 * Двухрядный хедер (top bar + main bar):
 * - expanded: обе строки видны (телефон/соцсети + лого/иконки).
 * - compact: только top bar скрыт (height:0), main bar всегда видим и остаётся под marquee.
 * Spacer постоянной высоты — контент не прыгает.
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerMode = useHeaderScrollDirection();
  const isExpanded = headerMode === "expanded";

  const [topBarHeight, setTopBarHeight] = useState(TOP_BAR_H_DEFAULT);
  const topBarMeasureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = topBarMeasureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (h > 0) setTopBarHeight(h);
    });
    ro.observe(el);
    if (el.offsetHeight > 0) setTopBarHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const spacerHeight = MARQUEE_H + topBarHeight + MAIN_H;

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

        <div
          className="w-full bg-header-bg relative z-50"
          style={{
            height: isExpanded ? topBarHeight : 0,
            margin: 0,
            padding: 0,
            overflow: "visible",
            opacity: isExpanded ? 1 : 0,
            transition: `height ${HEADER_TRANSITION_MS}ms ease, opacity ${HEADER_TRANSITION_MS}ms ease`,
            boxSizing: "border-box",
            pointerEvents: isExpanded ? "auto" : "none",
            willChange: "transform",
          }}
        >
          <div ref={topBarMeasureRef} style={{ height: "auto" }}>
            <TopBar />
          </div>
        </div>

        {/* Разделитель между верхней и нижней зелёной полосой: отдельный div, цвет как у вертикальных разделителей в TopBar */}
        {isExpanded && (
          <div
            className="h-px w-full shrink-0 bg-header-foreground"
            aria-hidden
          />
        )}

        {/* Main bar: всегда видим, не двигаем — при compact topBar уже height:0, main bar остаётся под marquee */}
        <div
          className="w-full bg-header-bg flex items-center"
          style={{
            height: MAIN_H,
            margin: 0,
            padding: 0,
            overflow: "visible",
          }}
        >
          <HeaderMain isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        </div>
      </header>

      <div
        aria-hidden
        style={{
          height: spacerHeight,
          margin: 0,
          padding: 0,
        }}
      />
    </>
  );
}
