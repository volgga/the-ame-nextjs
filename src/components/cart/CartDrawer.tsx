"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CartItemsList } from "./CartItemsList";
import { CheckoutFormModal } from "./CheckoutFormModal";
import type { PromoTotals } from "./PromoCodeBlock";
import { UpsellSection } from "./UpsellSection";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/formatPrice";

const Z_CART_OVERLAY = 200;
const Z_CART_PANEL = 201;

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state } = useCart();
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [totals, setTotals] = useState<PromoTotals | null>(null);

  const subtotal = state.total; // сумма по позициям

  const fetchTotals = useCallback(async () => {
    if (subtotal <= 0) {
      setTotals({ subtotal: 0, discount: 0, total: 0, promo: null });
      return;
    }
    try {
      const res = await fetch("/api/cart/totals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setTotals({
          subtotal: data.subtotal ?? subtotal,
          discount: data.discount ?? 0,
          total: data.total ?? subtotal,
          promo: data.promo ?? null,
        });
      } else {
        setTotals({ subtotal, discount: 0, total: subtotal, promo: null });
      }
    } catch {
      setTotals({ subtotal, discount: 0, total: subtotal, promo: null });
    }
  }, [subtotal]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen && state.items.length > 0) {
      fetchTotals();
    } else if (state.items.length === 0) {
      setTotals(null);
    }
  }, [isOpen, state.items.length, state.total, fetchTotals]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [isOpen]);

  const displayTotals: PromoTotals = totals ?? { subtotal, discount: 0, total: subtotal, promo: null };

  const handlePromoApplySuccess = useCallback((newTotals: PromoTotals) => {
    setTotals(newTotals);
  }, []);

  const handlePromoRemoveSuccess = useCallback(() => {
    setTotals((t) =>
      t
        ? { ...t, discount: 0, total: t.subtotal, promo: null }
        : { subtotal, discount: 0, total: subtotal, promo: null }
    );
  }, [subtotal]);

  if (!mounted) return null;

  const content = (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: Z_CART_OVERLAY }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[720px] max-h-[min(90vh,calc(100dvh-2rem))] bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ease-out flex flex-col ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ zIndex: Z_CART_PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка: закреплена сверху, не скроллится */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-center px-4 sm:px-6 pt-4 pb-3 border-b border-border-block bg-white">
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-color-text-main">Корзина</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-4 md:right-6 top-4 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors hover:opacity-80 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-color-text-main/30 focus-visible:ring-offset-2 text-color-text-main touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Контент с прокруткой */}
        <div ref={scrollContainerRef} className="overflow-y-auto flex-1 min-h-0">
          <div className="p-4 sm:p-6 pt-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-4">Ваш заказ:</h2>
              {state.items.length === 0 ? (
                <p className="text-muted-foreground">Корзина пуста</p>
              ) : (
                <>
                  <CartItemsList />
                  {/* Итоги */}
                  <div className="mt-4 text-right space-y-1">
                    <div className="text-[#111]">Подытог: {formatPrice(displayTotals.subtotal)}</div>
                    {displayTotals.discount > 0 && (
                      <div className="text-green-600">Скидка: -{formatPrice(displayTotals.discount)}</div>
                    )}
                    <div className="font-bold text-lg">Итого: {formatPrice(displayTotals.total)}</div>
                  </div>
                  <UpsellSection />
                </>
              )}
            </div>
            {state.items.length > 0 && (
              <CheckoutFormModal
                totals={displayTotals}
                onTotalsUpdate={handlePromoApplySuccess}
                onTotalsReset={handlePromoRemoveSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
