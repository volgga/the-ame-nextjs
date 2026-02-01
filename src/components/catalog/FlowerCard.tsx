"use client";

import Link from "next/link";
import { Flower } from "@/types/flower";
import { Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { buildProductUrl } from "@/utils/buildProductUrl";

interface FlowerCardProps {
  flower: Flower;
  onToggleFavorite?: (flower: Flower) => void;
}

export const FlowerCard = ({ flower, onToggleFavorite }: FlowerCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(flower);
    // TODO: добавить toast уведомления
  };

  const handleToggleFavorite = () => {
    // TODO: добавить логику избранного
    onToggleFavorite?.(flower);
  };

  const productUrl = buildProductUrl({
    name: flower.name,
    productSlug: flower.slug ?? null,
  });

  return (
    <div className="group relative flex flex-col h-full">
      <Link href={productUrl} aria-label={flower.name} className="block flex-1">
        {/* 📸 Фото — квадрат 1:1, без рамок/теней, со скруглением */}
        <div className="relative overflow-hidden rounded-2xl aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flower.image}
            alt={flower.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* 📝 Название и цена */}
        <div className="mt-3 px-1">
          <h3 className="text-sm md:text-base font-normal leading-snug text-gray-800 line-clamp-2 min-h-[42px] md:min-h-0">
            {flower.name}
          </h3>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-base md:text-lg font-semibold text-gray-900">
              {flower.isPreorder ? "Предзаказ" : `${flower.price.toLocaleString("ru-RU")} ₽`}
            </span>

            {/* ❤️ Избранное */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleFavorite();
              }}
              className="p-2 rounded-full transition-all duration-200 bg-muted hover:bg-destructive hover:text-destructive-foreground"
              title="Добавить в избранное"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* 🛒 Кнопка В корзину / Сделать предзаказ */}
      <div className="mt-3 px-1">
        {flower.inStock ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            className="w-full rounded-full px-6 h-10 text-sm md:text-base font-medium bg-[#819570] hover:bg-[#6f7f5f] text-white transition-colors"
          >
            В корзину
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open("https://wa.me/message/XQDDWGSEL35LP1", "_blank");
            }}
            className="w-full rounded-full px-6 h-10 text-sm md:text-base font-medium bg-[#819570] hover:bg-[#6f7f5f] text-white transition-colors"
          >
            Предзаказ
          </button>
        )}
      </div>
    </div>
  );
};
