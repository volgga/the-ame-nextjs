"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flower } from "@/types/flower";
import { Heart, ShoppingCart, Search } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { buildProductUrl } from "@/utils/buildProductUrl";
import { QuickBuyModal } from "@/components/cart/QuickBuyModal";
import { QuickViewModal, type QuickViewProductData } from "@/components/catalog/QuickViewModal";
import { runFlyToHeader } from "@/utils/flyToHeader";
import type { Product } from "@/lib/products";

interface FlowerCardProps {
  flower: Flower;
  product?: Product; // Опциональный Product для передачи дополнительных данных (images, composition)
}

export const FlowerCard = ({ flower, product }: FlowerCardProps) => {
  const { addToCart } = useCart();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(flower);
  };

  const inFavorites = mounted ? isFavorite(flower.id) : false;

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

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const productUrl = buildProductUrl({
    name: flower.name,
    productSlug: flower.slug ?? null,
  });

  // Подготавливаем данные для Quick View
  // Используем данные из Product если доступны, иначе из Flower
  const quickViewProduct: QuickViewProductData = {
    id: flower.id,
    name: flower.name,
    price: flower.price,
    image: flower.image,
    images: product?.images && product.images.length > 0 ? product.images : [flower.image],
    composition: product?.composition || undefined,
    categories: product?.categories && product.categories.length > 0 ? product.categories : undefined,
    isPreorder: flower.isPreorder ?? product?.isPreorder,
    slug: flower.slug ?? product?.slug ?? null,
  };

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
    <div className="relative flex flex-col h-full">
      <Link href={productUrl} aria-label={flower.name} className="block flex-1">
        {/* 📸 Фото + hover-иконки (лупа, сердечко) — group на контейнере фото */}
        <div className="group relative overflow-hidden rounded-2xl aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flower.image}
            alt={flower.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* ❤️ Избранное и 🔍 Быстрый просмотр — показываются только при hover на фото (slide-in + fade), на touch скрыты */}
          <div
            className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 translate-x-2 pointer-events-none transition-[opacity,transform] duration-200 ease-out [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:pointer-events-auto"
          >
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`btn-icon-circle group ${mounted && inFavorites ? "selected" : ""}`}
              title={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
              aria-label={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  mounted && inFavorites
                    ? "fill-[var(--color-text-main)] text-[var(--color-text-main)]"
                    : "text-[var(--color-text-main)] group-hover:text-[var(--header-foreground)]"
                }`}
                strokeWidth={1.5}
              />
            </button>
            <button
              type="button"
              onClick={openQuickView}
              className="btn-icon-circle group"
              title="Быстрый просмотр"
              aria-label="Быстрый просмотр"
            >
              <Search
                className="w-4 h-4 text-[var(--color-text-main)] group-hover:text-[var(--header-foreground)] transition-colors"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>

        {/* Название под фото: по левому краю, одна строка, ellipsis — text-base */}
        <h3 className="mt-3 px-1 min-w-0 text-base font-normal text-color-text-main text-left overflow-hidden text-ellipsis whitespace-nowrap">
          {flower.name}
        </h3>
      </Link>

      {/* Нижний блок: цена — главный якорь (text-lg), кнопки (min-h-[44px] на мобиле) */}
      <div className="mt-1.5 px-1 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <span className="text-lg font-semibold text-color-text-main shrink-0 leading-none">{priceLabel}</span>
        <div className="flex items-center gap-1 shrink-0">
          {/* На мобильной: иконка избранного вместо скрытой кнопки «Купить в 1 клик» */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`product-cta h-6 w-6 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 touch-manipulation md:hidden ${mounted && inFavorites ? "border-[var(--color-accent-btn)]" : ""}`}
            title={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
            aria-label={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
          >
            <Heart
              className={`w-4 h-4 ${mounted && inFavorites ? "fill-[var(--color-accent-btn)] text-[var(--color-accent-btn)]" : ""}`}
              strokeWidth={1.5}
            />
          </button>
          <button
            type="button"
            onClick={openQuickBuyModal}
            className="product-cta min-h-[36px] py-1 rounded-full pl-2.5 pr-2 text-sm font-normal leading-none bg-page-bg border border-[var(--color-outline-border)] text-color-text-main flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 touch-manipulation hidden md:inline-flex"
          >
            Купить в 1 клик
          </button>
          <button
            type="button"
            onClick={handleCartClick}
            className="product-cta h-6 w-6 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 touch-manipulation"
            title={flower.inStock ? "В корзину" : "Предзаказ"}
            aria-label={flower.inStock ? "В корзину" : "Предзаказ"}
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={1.6} />
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
      <QuickViewModal
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={quickViewOpen ? quickViewProduct : null}
      />
    </div>
  );
};
