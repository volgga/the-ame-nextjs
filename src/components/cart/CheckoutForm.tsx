"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Plus, Minus, X } from "lucide-react";
import Image from "next/image";

/**
 * CheckoutForm — упрощённая версия формы оформления заказа.
 * Пока только отображение товаров в корзине с возможностью изменения количества.
 * Позже добавим форму доставки и оплаты.
 */
export const CheckoutForm = () => {
  const { state, updateQuantity, removeFromCart } = useCart();

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <div className="space-y-6">
      {/* Список товаров */}
      <div className="space-y-4">
        {state.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 border rounded-lg bg-white"
          >
            {/* Изображение */}
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#ece9e2] flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Информация */}
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {item.price.toLocaleString("ru-RU")} ₽
              </p>

              {/* Управление количеством */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateItemQuantity(item.id, item.cartQuantity - 1)}
                  className="w-8 h-8 rounded-full border border-input bg-background hover:bg-accent flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.cartQuantity}</span>
                <button
                  type="button"
                  onClick={() => updateItemQuantity(item.id, item.cartQuantity + 1)}
                  className="w-8 h-8 rounded-full border border-input bg-background hover:bg-accent flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="ml-auto text-destructive hover:text-destructive/80"
                  aria-label="Удалить"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Итого по товару */}
            <div className="text-right">
              <div className="font-semibold">
                {(item.price * item.cartQuantity).toLocaleString("ru-RU")} ₽
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Итого */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Итого:</span>
          <span>{state.total.toLocaleString("ru-RU")} ₽</span>
        </div>
      </div>

      {/* TODO: Форма доставки и оплаты будет добавлена позже */}
    </div>
  );
};
