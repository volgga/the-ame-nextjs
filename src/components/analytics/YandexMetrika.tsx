"use client";

import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { sendMetrikaParams, type PageType } from "@/lib/metrika/params";

const YANDEX_METRIKA_ID = 103806735;

declare global {
  interface Window {
    ym?: (id: number, action: string, opts?: string | object) => void;
  }
}

/**
 * Определить тип страницы по pathname для параметров Метрики.
 */
function getPageType(pathname: string): PageType {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname.startsWith("/magazin") || pathname.startsWith("/magazine/")) return "catalog";
  if (pathname.startsWith("/clients/blog")) return "blog";
  if (pathname === "/about") return "about";
  if (pathname === "/contacts") return "contacts";
  if (pathname === "/payment/success") return "success";
  if (pathname.includes("checkout") || pathname.includes("payment")) return "checkout";
  return "home";
}

/**
 * Извлечь category_slug из pathname (для /magazine/[slug]).
 */
function extractCategorySlug(pathname: string): string | undefined {
  const match = pathname.match(/^\/magazine\/([^/]+)/);
  return match ? match[1] : undefined;
}

/**
 * Извлечь product_id из pathname (для /product/[slug]).
 * Возвращает slug (используем как идентификатор).
 */
function extractProductId(pathname: string): string | undefined {
  const match = pathname.match(/^\/product\/([^/]+)/);
  return match ? match[1] : undefined;
}

/**
 * Отправка hit при смене страницы (SPA) и параметров визита.
 * Счётчик и init — в layout инлайн-скриптом у начала body.
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
      // Отправляем параметры для первой страницы
      const pageType = getPageType(pathname);
      sendMetrikaParams({
        page_type: pageType,
        category_slug: extractCategorySlug(pathname),
        product_id: extractProductId(pathname),
      });
      return;
    }
    if (prevPathRef.current === pathname) return;

    prevPathRef.current = pathname;
    window.ym(YANDEX_METRIKA_ID, "hit", fullUrl);

    // Отправляем параметры при смене страницы
    const pageType = getPageType(pathname);
    sendMetrikaParams({
      page_type: pageType,
      category_slug: extractCategorySlug(pathname),
      product_id: extractProductId(pathname),
    });
  }, [pathname]);

  return null;
}
