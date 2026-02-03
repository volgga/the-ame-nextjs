"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CartItemsList } from "./CartItemsList";
import { CheckoutFormModal } from "./CheckoutFormModal";
import { UpsellSection } from "./UpsellSection";
import { useCart } from "@/context/CartContext";

const Z_CART_OVERLAY = 200;
const Z_CART_PANEL = 201;

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[720px] max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ zIndex: Z_CART_PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto h-full max-h-[90vh]">
          <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-border-block">
            <h2 className="text-lg font-bold uppercase tracking-wide text-color-text-main">Корзина</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-color-text-main/30 focus-visible:ring-offset-2 text-color-text-main"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 pt-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-4">Ваш заказ:</h2>
              {state.items.length === 0 ? (
                <p className="text-muted-foreground">Корзина пуста</p>
              ) : (
                <>
                  <CartItemsList />
                  <div className="mt-4 text-right">
                    <div className="font-bold text-lg">Сумма: {state.total.toLocaleString("ru-RU")} р.</div>
                  </div>
                  <UpsellSection />
                </>
              )}
            </div>
            {state.items.length > 0 && <CheckoutFormModal />}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
