"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HomeBelowFoldSkeleton } from "./HomeBelowFoldSkeleton";

const ROOT_MARGIN = "800px 0px";
const TRIGGER_ONCE = true;

type ProgressiveBelowFoldProps = {
  children: ReactNode;
};

/**
 * Обёртка для контента ниже первого экрана на главной.
 * Сразу после слайдов/карточек ставим sentinel; при входе в зону с rootMargin 800px
 * запускаем показ контента. Пока не показан — рендерим skeleton, без пустоты.
 */
export function ProgressiveBelowFold({ children }: ProgressiveBelowFoldProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (TRIGGER_ONCE && triggeredRef.current) continue;
          triggeredRef.current = true;
          setShouldShow(true);
          break;
        }
      },
      { root: null, rootMargin: ROOT_MARGIN, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel: невидимый элемент для раннего срабатывания IO */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
      {!shouldShow ? (
        <HomeBelowFoldSkeleton />
      ) : null}
      <div className={shouldShow ? "contents" : "hidden"}>{children}</div>
    </>
  );
}
