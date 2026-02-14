"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Flower } from "@/types/flower";
import { PLACEHOLDER_IMAGE, isValidImageUrl } from "@/utils/imageUtils";
import { Heart, ShoppingCart, Search, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { buildProductUrl } from "@/utils/buildProductUrl";
import type { QuickViewProductData } from "@/components/catalog/QuickViewModal";
import { runFlyToHeader } from "@/utils/flyToHeader";
import { trackAddToCart } from "@/lib/metrika/ecommerce";
import type { Product } from "@/lib/products";

const QuickBuyModal = dynamic(
  () => import("@/components/cart/QuickBuyModal").then((m) => m.QuickBuyModal),
  { ssr: false }
);

const PreorderModal = dynamic(
  () => import("@/components/cart/PreorderModal").then((m) => m.PreorderModal),
  { ssr: false }
);

const QuickViewModal = dynamic(
  () => import("@/components/catalog/QuickViewModal").then((m) => m.QuickViewModal),
  { ssr: false }
);

interface FlowerCardProps {
  flower: Flower;
  product?: Product; // Опциональный Product для передачи дополнительных данных (images, composition)
  showNewBadge?: boolean; // Показывать ли бейдж "новый" (по умолчанию true)
  hideFavoriteOnMobile?: boolean; // Скрывать ли кнопку избранного на мобилке (по умолчанию false)
  showPriceFromOnMobile?: boolean; // Показывать ли "от" перед ценой на мобилке (по умолчанию false)
}

export const FlowerCard = ({ flower, product, showNewBadge = true, hideFavoriteOnMobile = false, showPriceFromOnMobile = false }: FlowerCardProps) => {
  const { addToCart } = useCart();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [preorderOpen, setPreorderOpen] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => setMounted(true), []);

  const imageSrc = !isValidImageUrl(flower.image) || imgError ? PLACEHOLDER_IMAGE : flower.image!.trim();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(flower);
    trackAddToCart({
      id: flower.id,
      name: flower.name,
      price: flower.price,
      category: flower.category,
    });
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

  const isPreorder = flower.isPreorder ?? product?.isPreorder ?? false;

  const hasDiscount = flower.originalPrice != null && flower.originalPrice > flower.price;
  const NBSP = "\u00A0";
  const priceLabel = flower.priceFrom
    ? `от ${flower.price.toLocaleString("ru-RU")}${NBSP}₽`
    : `${flower.price.toLocaleString("ru-RU")}${NBSP}₽`;
  const oldPriceLabel =
    flower.priceFrom && flower.originalPrice != null
      ? `от ${flower.originalPrice.toLocaleString("ru-RU")}${NBSP}₽`
      : flower.originalPrice != null
        ? `${flower.originalPrice.toLocaleString("ru-RU")}${NBSP}₽`
        : null;

  // Проверка эффективного статуса "новый": is_new = true AND new_until > now()
  // Бейдж показывается только если showNewBadge = true (по умолчанию true)
  const isNewEffective =
    showNewBadge && product?.isNew === true && product?.newUntil != null && new Date(product.newUntil) > new Date();

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
        <div className="group relative overflow-hidden rounded-2xl aspect-square bg-[#ece9e2]">
          {/* BadgesWrapper: один контейнер, NEW сверху, Скидка под ним (или вместо) */}
          {(isNewEffective || hasDiscount) && (
            <div className="absolute top-1.5 left-0 z-10 flex flex-col gap-1 md:top-2 md:gap-1.5">
              {isNewEffective && (
                <div className="new-badge w-fit px-2.5 py-1 md:px-3 md:py-1.5 rounded-tr-lg rounded-br-lg bg-[var(--page-bg)] text-[var(--color-text-main)] text-[10px] md:text-xs font-medium leading-none">
                  НОВЫЙ
                </div>
              )}
              {hasDiscount && (
                <div className="w-fit px-2.5 py-1 md:px-3 md:py-1.5 rounded-tr-lg rounded-br-lg bg-[var(--header-bg)] text-[var(--header-foreground)] text-[10px] md:text-xs font-medium leading-none">
                  {flower.discountPercent != null && flower.discountPercent > 0
                    ? `-${Math.round(flower.discountPercent)}%`
                    : "СКИДКА"}
                </div>
              )}
            </div>
          )}
          <Image
            src={imageSrc}
            alt={flower.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 300px"
            quality={88}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {/* Mobile: сердечко в правом нижнем углу фото */}
          {!hideFavoriteOnMobile && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`absolute bottom-2 right-2 z-10 h-7 w-7 min-h-[28px] min-w-[28px] flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-1 touch-manipulation md:hidden ${mounted && inFavorites ? "border-[var(--color-accent-btn)]" : ""}`}
              title={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
              aria-label={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
            >
              <Heart
                className={`w-3 h-3 ${mounted && inFavorites ? "fill-[var(--color-accent-btn)] text-[var(--color-accent-btn)]" : ""}`}
                strokeWidth={1.5}
              />
            </button>
          )}
          {/* ❤️ Избранное и 🔍 Быстрый просмотр — показываются только при hover на фото (slide-in + fade), на touch скрыты */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 translate-x-2 pointer-events-none transition-[opacity,transform] duration-200 ease-out [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:pointer-events-auto">
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

        {/* Название: 1 строка с ellipsis */}
        <h3 className="mt-3 px-1 min-w-0 text-base font-normal text-color-text-main text-left overflow-hidden text-ellipsis whitespace-nowrap">
          {flower.name}
        </h3>
      </Link>

      {/* actionsRow: price (left) | actions (right). Desktop: heart + cart/preorder рядом */}
      <div className="px-1 mt-2 flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between md:gap-2 min-w-0">
        {/* Price block: PC — одна effective; Mobile — новая + старая при скидке, clamp font */}
        <div
          className="flex items-baseline min-w-0 flex-shrink overflow-hidden flex-nowrap"
          style={{ gap: "8px" }}
        >
          <span
            className="font-semibold text-color-text-main leading-tight shrink-0 md:text-lg"
            style={{ fontSize: "clamp(14px, 4vw, 18px)" }}
          >
            {priceLabel}
          </span>
          {oldPriceLabel != null && (
            <span
              className="md:hidden text-color-text-secondary/80 line-through shrink-0 whitespace-nowrap"
              style={{ fontSize: "clamp(12px, 3.2vw, 14px)" }}
            >
              {oldPriceLabel}
            </span>
          )}
        </div>

        {/* Actions: Mobile — full-width кнопка. Desktop — "Купить в 1 клик" + heart + cart/preorder рядом */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 md:shrink-0 md:flex-nowrap">
          {isPreorder ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPreorderOpen(true);
                }}
                className="product-cta w-full md:w-9 md:min-w-[36px] md:h-9 min-h-[36px] md:py-0 rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 touch-manipulation text-sm font-medium md:px-0"
                aria-label="Предзаказ"
                title="Предзаказ"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} aria-hidden />
                <span className="md:hidden">Предзаказ</span>
              </button>
              {!hideFavoriteOnMobile && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`product-cta h-9 w-9 min-h-[36px] min-w-[36px] hidden md:flex items-center justify-center rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 ${mounted && inFavorites ? "border-[var(--color-accent-btn)]" : ""}`}
                  title={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
                  aria-label={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
                >
                  <Heart className={`w-3.5 h-3.5 ${mounted && inFavorites ? "fill-[var(--color-accent-btn)] text-[var(--color-accent-btn)]" : ""}`} strokeWidth={1.5} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={openQuickBuyModal}
                className="product-cta min-h-[36px] py-0.5 rounded-full pl-2 pr-1.5 text-xs font-normal leading-none bg-page-bg border border-[var(--color-outline-border)] text-color-text-main hidden md:inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
              >
                Купить в 1 клик
              </button>
              {!hideFavoriteOnMobile && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`product-cta h-9 w-9 min-h-[36px] min-w-[36px] hidden md:flex items-center justify-center rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 ${mounted && inFavorites ? "border-[var(--color-accent-btn)]" : ""}`}
                  title={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
                  aria-label={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
                >
                  <Heart className={`w-3.5 h-3.5 ${mounted && inFavorites ? "fill-[var(--color-accent-btn)] text-[var(--color-accent-btn)]" : ""}`} strokeWidth={1.5} />
                </button>
              )}
              <button
                type="button"
                onClick={handleCartClick}
                className="product-cta w-full md:w-9 md:min-w-[36px] md:h-9 min-h-[40px] md:min-h-[36px] rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 touch-manipulation text-sm font-medium md:px-0"
                title={flower.inStock ? "В корзину" : "Предзаказ"}
                aria-label={flower.inStock ? "В корзину" : "Предзаказ"}
              >
                <ShoppingCart className="w-3.5 h-3.5 md:block hidden shrink-0" strokeWidth={1.6} />
                <span className="md:hidden">{flower.inStock ? "В корзину" : "Предзаказ"}</span>
              </button>
            </>
          )}
          {!hideFavoriteOnMobile && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`product-cta h-9 w-9 min-h-[36px] min-w-[36px] hidden md:flex items-center justify-center rounded-full bg-page-bg border border-[var(--color-outline-border)] text-color-text-main shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 ${mounted && inFavorites ? "border-[var(--color-accent-btn)]" : ""}`}
              title={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
              aria-label={mounted && inFavorites ? "Убрать из избранного" : "Добавить в избранное"}
            >
              <Heart
                className={`w-3.5 h-3.5 ${mounted && inFavorites ? "fill-[var(--color-accent-btn)] text-[var(--color-accent-btn)]" : ""}`}
                strokeWidth={1.5}
              />
            </button>
          )}
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
          productPath: productUrl,
        }}
      />
      <PreorderModal
        isOpen={preorderOpen}
        onClose={() => setPreorderOpen(false)}
        product={{
          id: flower.id,
          name: flower.name,
          image: flower.image,
          price: flower.price,
          productPath: productUrl,
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
