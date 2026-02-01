"use client";

import { useState } from "react";
import Link from "next/link";
import { Flower } from "@/types/flower";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { buildProductUrl } from "@/utils/buildProductUrl";
import { QuickBuyModal } from "@/components/cart/QuickBuyModal";
import { runFlyToHeader } from "@/utils/flyToHeader";

interface FlowerCardProps {
  flower: Flower;
}

export const FlowerCard = ({ flower }: FlowerCardProps) => {
  const { addToCart } = useCart();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(flower);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (!inFavorites) runFlyToHeader("favorite", rect);
    toggleFavorite(flower.id);
  };

  const openQuickBuyModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickBuyOpen(true);
  };

  const productUrl = buildProductUrl({
    name: flower.name,
    productSlug: flower.slug ?? null,
  });

  const inFavorites = isFavorite(flower.id);

  const priceLabel = flower.isPreorder
    ? "Предзаказ"
    : flower.priceFrom
      ? `от ${flower.price.toLocaleString("ru-RU")} ₽`
      : `${flower.price.toLocaleString("ru-RU")} ₽`;

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (flower.inStock) {
      const rect = e.currentTarget.getBoundingClientRect();
      handleAddToCart(e);
      runFlyToHeader("cart", rect);
    } else {
      window.open("https://wa.me/message/XQDDWGSEL35LP1", "_blank");
    }
  };

  return (
    <div className="group relative flex flex-col h-full">
      <Link href={productUrl} aria-label={flower.name} className="block flex-1">
        {/* 📸 Фото + сердечко overlay */}
        <div className="relative overflow-hidden rounded-2xl aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flower.image}
            alt={flower.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* ❤️ Избранное — тот же размер, что корзина и «Купить в 1 клик» (h-8 w-8) */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="product-cta absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-[var(--color-outline-border)] text-color-text-main shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
            title={inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
            aria-label={inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-[fill,stroke] duration-[180ms] ease-out ${
                inFavorites
                  ? "fill-[var(--color-bg-main)] stroke-[var(--color-bg-main)]"
                  : "fill-transparent stroke-[var(--color-text-main)]"
              }`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Название под фото: по левому краю, одна строка, ellipsis — text-base */}
        <h3 className="mt-3 px-1 min-w-0 text-base font-normal text-color-text-main text-left overflow-hidden text-ellipsis whitespace-nowrap">
          {flower.name}
        </h3>
      </Link>

      {/* Нижний блок: цена — главный якорь (text-lg), кнопки одного размера (h-8) */}
      <div className="mt-1.5 px-1 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold text-color-text-main shrink-0 leading-none">{priceLabel}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={openQuickBuyModal}
            className="product-cta h-8 rounded-full pl-3 pr-2.5 text-sm font-normal leading-none bg-page-bg border border-[var(--color-outline-border)] text-color-text-main flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
          >
            Купить в 1 клик
          </button>
          <button
            type="button"
            onClick={handleCartClick}
            className="product-cta h-8 w-8 flex items-center justify-center rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
            title={flower.inStock ? "В корзину" : "Предзаказ"}
            aria-label={flower.inStock ? "В корзину" : "Предзаказ"}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <QuickBuyModal
        isOpen={quickBuyOpen}
        onClose={() => setQuickBuyOpen(false)}
        product={{
          id: flower.id,
          name: flower.name,
          image: flower.image,
          price: flower.price,
        }}
      />
    </div>
  );
};
