"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function CartIcon() {
  const { state } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const iconLinkClass =
    "relative inline-flex items-center justify-center text-[#819570]/95 hover:text-[#819570] transition cursor-pointer";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Корзина"
        className={iconLinkClass}
      >
        <svg
          className="w-5 h-5 md:w-6 md:h-6 text-[#819570]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a12.75 12.75 0 003-9.75m-3 9.75a12.75 12.75 0 01-3-9.75m3 9.75h.008v.008H6v-.008z"
          />
        </svg>
        {/* Badge с количеством */}
        {state.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 text-[10px] flex items-center justify-center rounded-full bg-[#819570] text-white border border-[#ffe9c3] shadow-sm">
            {state.itemCount}
          </span>
        )}
      </button>

      {/* Модалка корзины */}
      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
