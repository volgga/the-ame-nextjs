"use client";

import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";

const YANDEX_METRIKA_ID = 103806735;

declare global {
  interface Window {
    ym?: (id: number, action: string, opts?: string | object) => void;
  }
}

/**
 * Отправка hit при смене страницы (SPA). Счётчик и init — в layout инлайн-скриптом у начала body.
 */
export function YandexMetrikaHitTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const isInitDoneRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ym) return;
    if (!pathname) return;

    const fullUrl = window.location.origin + pathname + (window.location.search || "");

    if (!isInitDoneRef.current) {
      isInitDoneRef.current = true;
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current === pathname) return;

    prevPathRef.current = pathname;
    window.ym(YANDEX_METRIKA_ID, "hit", fullUrl);
  }, [pathname]);

  return null;
}
