"use client";

import Script from "next/script";

const YANDEX_METRIKA_ID = 103806735;

/**
 * Яндекс.Метрика: загрузка tag.js и инициализация счётчика.
 * Клиентский компонент, чтобы onLoad не передавался из Server Component.
 */
export function YandexMetrika() {
  return (
    <>
      <Script
        id="yandex-metrika"
        src="https://mc.yandex.ru/metrika/tag.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && (window as unknown as { ym?: (id: number, action: string, opts?: object) => void }).ym) {
            (window as unknown as { ym: (id: number, action: string, opts?: object) => void }).ym(YANDEX_METRIKA_ID, "init", {
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: true,
            });
          }
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
