"use client";

import { useState, useEffect, useRef } from "react";

/** Порог в пикселях: переключаем режим только после проскролла в направлении (гистерезис, нет дёргания) */
const SCROLL_THRESHOLD_PX = 24;

export type HeaderMode = "expanded" | "compact";

/**
 * Хук: режим хедера по скроллу.
 * - expanded: видны обе строки (TopBar + MainBar).
 * - compact: TopBar скрыт, MainBar поднят и закреплён.
 * Обновление через requestAnimationFrame, с гистерезисом по порогу (нет дергания).
 */
export function useHeaderScrollDirection(): HeaderMode {
  const [mode, setMode] = useState<HeaderMode>("expanded");
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const modeRef = useRef<HeaderMode>("expanded");
  const accumulatedRef = useRef(0);

  useEffect(() => {
    let previousScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    const handleScroll = () => {
      if (typeof window === "undefined") return;
      const currentY = window.scrollY;
      lastScrollYRef.current = currentY;

      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        const prevY = previousScrollY;
        previousScrollY = currentY;

        if (currentY <= 0) {
          if (modeRef.current !== "expanded") {
            modeRef.current = "expanded";
            setMode("expanded");
          }
          accumulatedRef.current = 0;
          rafIdRef.current = null;
          return;
        }

        const delta = currentY - prevY;
        let accum = accumulatedRef.current;
        const isExpanded = modeRef.current === "expanded";

        if (isExpanded) {
          if (delta > 0) accum += delta;
          else accum = 0;
          if (accum >= SCROLL_THRESHOLD_PX) {
            modeRef.current = "compact";
            setMode("compact");
            accumulatedRef.current = 0;
          } else {
            accumulatedRef.current = accum;
          }
        } else {
          if (delta < 0) accum += -delta;
          else accum = 0;
          if (accum >= SCROLL_THRESHOLD_PX) {
            modeRef.current = "expanded";
            setMode("expanded");
            accumulatedRef.current = 0;
          } else {
            accumulatedRef.current = accum;
          }
        }
        rafIdRef.current = null;
      });
    };

    previousScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const initialY = previousScrollY;
    lastScrollYRef.current = initialY;
    const initialMode: HeaderMode = initialY <= 0 ? "expanded" : "compact";
    modeRef.current = initialMode;
    setMode(initialMode);
    accumulatedRef.current = 0;

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return mode;
}
