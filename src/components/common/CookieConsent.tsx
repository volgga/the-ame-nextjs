"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const accepted = localStorage.getItem(STORAGE_KEY) === "accepted";
    if (!accepted) setVisible(true);
  }, [mounted]);

  const accept = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") accept();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, accept]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Уведомление об использовании cookie"
      className="fixed bottom-4 right-4 z-[90] w-[min(360px,calc(100vw-2rem))] rounded-xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
    >
      <p className="text-sm text-[#333] leading-relaxed mb-4">
        К сайту подключен сервис веб-аналитики, использующий cookie-файлы для анализа пользовательской активности.
        Подробнее — в{" "}
        <Link
          href="/docs/privacy"
          className="text-color-text-main underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-color-text-main/30 focus-visible:ring-offset-1 rounded"
        >
          политике конфиденциальности
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={accept}
        className="w-full rounded-lg text-white px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-text-main focus-visible:ring-offset-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
      >
        OK
      </button>
    </div>
  );
}
