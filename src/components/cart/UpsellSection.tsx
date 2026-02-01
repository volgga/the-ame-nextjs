"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Flower } from "@/types/flower";

/**
 * UpsellSection — блок доп.товаров под суммой заказа.
 * Показывает карточки доп.товаров (шоколадки, открытки и т.д.).
 */
export function UpsellSection() {
  const { addAddonToCart, isAddonInCart } = useCart();

  // Мок-данные доп.товаров
  const addonItems: Array<{
    id: string;
    title: string;
    price: number;
    image: string;
  }> = [
    {
      id: "addon-1",
      title: "Шоколад премиум",
      price: 500,
      image: "https://theame.ru/placeholder.svg",
    },
    {
      id: "addon-2",
      title: "Открытка ручной работы",
      price: 200,
      image: "https://theame.ru/placeholder.svg",
    },
    {
      id: "addon-3",
      title: "Подарочная коробка",
      price: 300,
      image: "https://theame.ru/placeholder.svg",
    },
    {
      id: "addon-4",
      title: "Ароматическая свеча",
      price: 400,
      image: "https://theame.ru/placeholder.svg",
    },
  ];

  const handleAddAddon = (addon: (typeof addonItems)[number]) => {
    const flower: Flower = {
      id: addon.id,
      name: addon.title,
      price: addon.price,
      image: addon.image,
      description: "",
      category: "Дополнительно",
      inStock: true,
      quantity: 1,
      colors: [],
      size: "medium",
      occasion: [],
    };
    addAddonToCart(flower);
  };

  return (
    <div className="pt-4 border-t">
      <h3 className="text-base font-semibold mb-4">Добавить к заказу?</h3>

      {/* Горизонтальный скролл на мобиле, сетка на десктопе */}
      <div className="md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible flex md:grid pb-2 md:pb-0">
        {addonItems.map((addon) => {
          const inCart = isAddonInCart(addon.id);

          return (
            <div
              key={addon.id}
              className="flex-shrink-0 w-[140px] md:w-auto md:flex-shrink border border-gray-200 rounded-lg p-3 bg-white"
            >
              {/* Изображение */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#ece9e2] mb-2">
                <Image src={addon.image} alt={addon.title} fill className="object-cover" />
              </div>

              {/* Название и цена */}
              <h4 className="text-sm font-medium mb-1 line-clamp-2">{addon.title}</h4>
              <p className="text-sm font-semibold text-gray-900 mb-2">{addon.price.toLocaleString("ru-RU")} ₽</p>

              {/* Кнопка */}
              <button
                type="button"
                onClick={() => handleAddAddon(addon)}
                disabled={inCart}
                className={`w-full py-2 px-3 rounded-full text-xs font-medium transition-colors ${
                  inCart
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-accent-btn hover:bg-accent-btn-hover text-white"
                }`}
              >
                {inCart ? "Добавлено" : "Добавить"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
