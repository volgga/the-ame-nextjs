"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

/** Единый стиль иконок в шапке (поиск, избранное, корзина): размер, цвет, hover. */
const HEADER_ICON_CLASS =
  "relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded text-[#819570]/95 hover:text-[#819570] transition-colors hover:bg-[#819570]/5 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#819570]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffe9c3]";

export function CartIcon() {
  const { state } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Корзина"
        className={HEADER_ICON_CLASS}
      >
        <svg
          className="w-5 h-5 md:w-6 md:h-6 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {state.itemCount > 0 && (
          <span
            className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] px-1 text-[11px] font-medium flex items-center justify-center rounded-full bg-[#819570] text-white border-2 border-[#ffe9c3] pointer-events-none select-none"
            aria-hidden
          >
            {state.itemCount > 99 ? "99+" : state.itemCount}
          </span>
        )}
      </button>
      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
