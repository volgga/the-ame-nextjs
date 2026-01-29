"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { CartItemsList } from "./CartItemsList";
import { CheckoutFormModal } from "./CheckoutFormModal";
import { UpsellSection } from "./UpsellSection";
import { useCart } from "@/context/CartContext";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * CartDrawer — модальное окно корзины (по центру экрана).
 * Открывается по клику на иконку корзины, закрывается по X/фону/Esc.
 */
export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state } = useCart();

  // Блокировка скролла страницы при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay — затемняет всё (marquee, шапку, страницу); z выше шапки */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 200 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Модалка по центру экрана; весь контент скроллится, без липкой шапки */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[720px] max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 ease-out ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ zIndex: 201 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Один вертикальный скролл: крестик в правом верхнем углу и контент скроллятся вместе */}
        <div className="overflow-y-auto h-full max-h-[90vh]">
          <div className="flex justify-end pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
              style={{ color: "#819570" }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 pt-2 space-y-4">
          {/* Секция "Ваш заказ" */}
          <div>
            <h2 className="text-lg font-bold mb-4">Ваш заказ:</h2>
            {state.items.length === 0 ? (
              <p className="text-muted-foreground">Корзина пуста</p>
            ) : (
              <>
                <CartItemsList />
                {/* Итоговая сумма товаров */}
                <div className="mt-4 text-right">
                  <div className="font-bold text-lg">
                    Сумма: {state.total.toLocaleString("ru-RU")} р.
                  </div>
                </div>

                {/* Блок доп.товаров (upsell) */}
                <UpsellSection />
              </>
            )}
          </div>

          {/* Информационное сообщение */}
          {state.items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              В подарок мы упакуем ваш букет в транспортировочную коробку, добавим рекомендации по уходу, кризал и открытку по желанию.
            </p>
          )}

          {/* Форма оформления (только если есть товары) */}
          {state.items.length > 0 && <CheckoutFormModal />}
          </div>
        </div>
      </div>
    </>
  );
}
