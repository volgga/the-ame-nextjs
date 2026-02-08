"use client";

import { useEffect, useRef, useState } from "react";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/Footer";
import { FloatingSocialButton } from "@/components/FloatingSocialButton";
import { CookieConsent } from "@/components/common/CookieConsent";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { AdminLogoutOnLeave } from "@/components/admin/AdminLogoutOnLeave";
import type { MarqueeSettings } from "@/lib/homeMarquee";

/**
 * Оболочка приложения с провайдерами и основной разметкой.
 * initialMarquee — настройки бегущей дорожки (с сервера), передаются в Header.
 */
export function AppShell({
  children,
  initialMarquee,
}: {
  children: React.ReactNode;
  initialMarquee?: MarqueeSettings | null;
}) {
  const [isPageEnterActive, setIsPageEnterActive] = useState(false);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Проверяем prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsPageEnterActive(true);
      return;
    }

    // Эффект только при первом маунте (первая загрузка страницы)
    if (!hasAnimatedRef.current) {
      // Небольшая задержка для обеспечения правильного рендера
      const timer = setTimeout(() => {
        setIsPageEnterActive(true);
        hasAnimatedRef.current = true;
      }, 10);

      return () => clearTimeout(timer);
    } else {
      // Если уже анимировали, сразу показываем контент
      setIsPageEnterActive(true);
    }
  }, []);

  return (
    <CartProvider>
      <FavoritesProvider>
        <AdminLogoutOnLeave />
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-page-bg overflow-x-hidden">
          <Header marquee={initialMarquee} />
          <main
            className={`flex-1 bg-page-bg px-0.5 md:px-8 page-enter ${isPageEnterActive ? "page-enter--active" : ""}`}
          >
            {children}
          </main>
          <Footer />
          <FloatingSocialButton />
          <CookieConsent />
        </div>
      </FavoritesProvider>
    </CartProvider>
  );
}
