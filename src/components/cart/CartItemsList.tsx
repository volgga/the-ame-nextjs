"use client";

import { Plus, Minus, X } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

/**
 * CartItemsList — список товаров в корзине.
 * Показывает каждый товар с изображением, названием, количеством и управлением.
 */
export function CartItemsList() {
  const { state, updateQuantity, removeFromCart } = useCart();

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <div className="space-y-4">
      {state.items.map((item) => (
        <div key={item.id} className="flex gap-3">
          {/* Изображение товара */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#ece9e2] flex-shrink-0">
            <Image src={item.image} alt={item.name} fill className="object-cover" />
          </div>

          {/* Информация о товаре */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>

            {/* Количество (если > 1) */}
            {item.cartQuantity > 1 && (
              <p className="text-xs text-muted-foreground mb-2">Количество: {item.cartQuantity}</p>
            )}

            {/* Управление количеством */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateItemQuantity(item.id, item.cartQuantity - 1)}
                className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Уменьшить количество"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{item.cartQuantity}</span>
              <button
                type="button"
                onClick={() => updateItemQuantity(item.id, item.cartQuantity + 1)}
                className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Увеличить количество"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Цена и удаление */}
          <div className="flex flex-col items-end justify-between">
            <div className="font-semibold text-sm">{(item.price * item.cartQuantity).toLocaleString("ru-RU")} р.</div>
            <button
              type="button"
              onClick={() => removeFromCart(item.id)}
              className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Удалить товар"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
