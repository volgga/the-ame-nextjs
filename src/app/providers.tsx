"use client";

import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

/**
 * Глобальные провайдеры приложения.
 * Обязательно "use client" — CartProvider и FavoritesProvider используют хуки и localStorage.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </CartProvider>
  );
}
