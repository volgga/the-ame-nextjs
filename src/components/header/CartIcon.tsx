"use client";

import { useCart } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { formatPrice } from "@/utils/formatPrice";

/** Единый стиль иконок в шапке (поиск, избранное, корзина): на мобиле компактнее, tap area 44px. */
const HEADER_ICON_CLASS =
  "relative inline-flex items-center justify-center w-9 h-9 min-w-[44px] min-h-[44px] md:w-10 md:h-10 md:min-w-0 md:min-h-0 rounded text-header-foreground hover:opacity-80 active:opacity-60 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-header-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg";

export function CartIcon() {
  const { state, isCartDrawerOpen, openCartDrawer, closeCartDrawer } = useCart();

  return (
    <>
      <button
        id="header-cart"
        type="button"
        onClick={openCartDrawer}
        aria-label="Корзина"
        className="flex items-center gap-1.5 shrink-0 rounded text-header-foreground hover:opacity-80 active:opacity-60 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-header-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg"
      >
        <span className={`${HEADER_ICON_CLASS} pointer-events-none`}>
          <svg
            className="w-4 h-4 md:w-5 md:h-5 shrink-0"
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
              className="absolute z-10 min-w-[16px] h-[16px] px-1 text-[10px] font-medium flex items-center justify-center rounded-full bg-badge-bg text-badge-text pointer-events-none select-none leading-[16px]"
              style={{ top: "4px", right: "2px", transform: "translate(35%, -25%)" }}
              aria-hidden
            >
              {state.itemCount > 99 ? "99+" : state.itemCount}
            </span>
          )}
        </span>
        <span className="hidden md:inline text-sm font-medium text-header-foreground tabular-nums">
          {formatPrice(state.total)}
        </span>
      </button>
      <CartDrawer isOpen={isCartDrawerOpen} onClose={closeCartDrawer} />
    </>
  );
}
