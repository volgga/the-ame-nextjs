"use client";

import { CartProvider } from "@/context/CartContext";

/**
 * Глобальные провайдеры приложения.
 * Обязательно "use client" — CartProvider использует хуки и localStorage.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
