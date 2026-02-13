"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";

const YANDEX_METRIKA_ID = 103806735;

declare global {
  interface Window {
    ym?: (id: number, action: string, opts?: string | object) => void;
  }
}

/**
 * Яндекс.Метрика: загрузка tag.js и инициализация счётчика.
 * - Скрипт с ?id= для корректной инициализации.
 * - init только в onLoad (клиент), с ssr:true и полным набором опций.
 * - При смене маршрута (SPA) отправляется hit для учёта переходов.
 */
export function YandexMetrika() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const isInitDoneRef = useRef(false);

  // Отправка hit при смене страницы (SPA), без дубля с первым init
  useEffect(() => {
    if (typeof window === "undefined" || !window.ym) return;
    if (!pathname) return;

    const fullUrl = window.location.origin + pathname + (window.location.search || "");

    if (!isInitDoneRef.current) {
      isInitDoneRef.current = true;
      prevPathRef.current = pathname;
      return; // первый просмотр уже учтён в init
    }
    if (prevPathRef.current === pathname) return;

    prevPathRef.current = pathname;
    window.ym(YANDEX_METRIKA_ID, "hit", fullUrl);
  }, [pathname]);

  return (
    <>
      <Script
        id="yandex-metrika"
        src={`https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window === "undefined") return;
          const ym = window.ym;
          if (!ym) return;
          ym(YANDEX_METRIKA_ID, "init", {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true,
          });
        }}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
