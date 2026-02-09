"use client";

import { useState, useEffect, useRef } from "react";

export type HeaderMode = "expanded" | "compact";

/**
 * Хук: режим хедера по скроллу.
 * Переключение при любом ненулевом delta: вниз → compact, вверх → expanded.
 * Защита от дребезга: пока animationLockRef.current === true, скролл не меняет режим (lock снимается в Header по transitionend).
 */
export function useHeaderScrollDirection(animationLockRef?: React.MutableRefObject<boolean> | null): HeaderMode {
  const [mode, setMode] = useState<HeaderMode>("expanded");
  const lastScrollYRef = useRef(0);
  const previousScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const modeRef = useRef<HeaderMode>("expanded");

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      lastScrollYRef.current = window.scrollY;

      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        const currentY = lastScrollYRef.current;
        const prevY = previousScrollYRef.current;
        previousScrollYRef.current = currentY;

        if (animationLockRef?.current) {
          rafIdRef.current = null;
          return;
        }

        const delta = currentY - prevY;

        if (currentY <= 0) {
          if (modeRef.current !== "expanded") {
            modeRef.current = "expanded";
            setMode("expanded");
          }
          rafIdRef.current = null;
          return;
        }

        if (delta > 0 && modeRef.current === "expanded") {
          if (animationLockRef) animationLockRef.current = true;
          modeRef.current = "compact";
          setMode("compact");
        } else if (delta < 0 && modeRef.current === "compact") {
          if (animationLockRef) animationLockRef.current = true;
          modeRef.current = "expanded";
          setMode("expanded");
        }
        rafIdRef.current = null;
      });
    };

    const initialY = typeof window !== "undefined" ? window.scrollY : 0;
    lastScrollYRef.current = initialY;
    previousScrollYRef.current = initialY;
    const initialMode: HeaderMode = initialY <= 0 ? "expanded" : "compact";
    modeRef.current = initialMode;
    // Отложенный setState, чтобы не менять вывод до завершения гидратации
    const id = requestAnimationFrame(() => setMode(initialMode));

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [animationLockRef]);

  return mode;
}
