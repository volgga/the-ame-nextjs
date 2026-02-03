"use client";

import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/Footer";
import { FloatingSocialButton } from "@/components/FloatingSocialButton";
import { CookieConsent } from "@/components/common/CookieConsent";

/**
 * Оболочка приложения с провайдерами и основной разметкой.
 * Гарантирует, что CartProvider и FavoritesProvider оборачивают весь контент.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>
        <div className="min-h-screen flex flex-col bg-page-bg">
          <Header />
          <main className="flex-1 bg-page-bg">{children}</main>
          <Footer />
          <FloatingSocialButton />
          <CookieConsent />
        </div>
      </FavoritesProvider>
    </CartProvider>
  );
}
