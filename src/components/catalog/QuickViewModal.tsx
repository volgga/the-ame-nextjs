"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AppImage } from "@/components/ui/AppImage";
import { PLACEHOLDER_IMAGE, isValidImageUrl } from "@/utils/imageUtils";
import { X, ChevronLeft, ChevronRight, ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { QuickBuyModal } from "@/components/cart/QuickBuyModal";
import { runFlyToHeader } from "@/utils/flyToHeader";
import { buildProductUrl } from "@/utils/buildProductUrl";
import { trackProductDetail, trackAddToCart } from "@/lib/metrika/ecommerce";

const Z_OVERLAY = 200;
const Z_PANEL = 201;

export type QuickViewProductData = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  composition?: string | null;
  categories?: string[];
  isPreorder?: boolean;
  slug?: string | null;
  /** Варианты изображения для оптимизации */
  imageThumbUrl?: string | null;
  imageMediumUrl?: string | null;
  imageLargeUrl?: string | null;
  imageThumbAvifUrl?: string | null;
  imageMediumAvifUrl?: string | null;
  imageLargeAvifUrl?: string | null;
};

type QuickViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProductData | null;
};

export function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const { addToCart, updateQuantity } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Сброс состояния при открытии/закрытии
  useEffect(() => {
    if (isOpen && product) {
      setCurrentImageIndex(0);
      setQuantity(1);
    }
  }, [isOpen, product]);

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

  // Просмотр карточки товара (detail) при открытии модалки
  useEffect(() => {
    if (isOpen && product) {
      trackProductDetail({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.categories?.[0],
      });
    }
  }, [isOpen, product?.id, product?.name, product?.price, product?.categories]);

  if (!mounted || !isOpen || !product) return null;

  // Формируем массив изображений; невалидные заменяем placeholder
  const raw = product.images && product.images.length > 0 ? product.images : [product.image];
  const images = raw
    .filter((u) => typeof u === "string" && u.trim())
    .map((u) => (isValidImageUrl(u) ? u!.trim() : PLACEHOLDER_IMAGE));
  const displayImages = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const canGoPrev = displayImages.length > 1 && currentImageIndex > 0;
  const canGoNext = displayImages.length > 1 && currentImageIndex < displayImages.length - 1;

  const handlePrevImage = () => {
    if (canGoPrev) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleNextImage = () => {
    if (canGoNext) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const flower = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: "",
      category: product.categories?.[0] || "Разное",
      inStock: true,
      quantity: 1,
      colors: [],
      size: "medium" as const,
      occasion: [],
      slug: null,
      categorySlug: null,
      isPreorder: product.isPreorder ?? false,
    };

    // Добавляем товар один раз, затем обновляем количество
    addToCart(flower);
    if (quantity > 1) {
      updateQuantity(product.id, quantity);
    }
    trackAddToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.categories?.[0],
      },
      quantity
    );
    runFlyToHeader("cart", rect);
    onClose();
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickBuyOpen(true);
  };

  const content = (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: Z_OVERLAY }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ zIndex: Z_PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-border-block">
          <h2 className="text-xl font-semibold text-color-text-main">Быстрый просмотр</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-color-text-secondary hover:text-color-text-main hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Контент */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Галерея фото */}
            <div className="relative">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black/5">
                {displayImages.length > 0 ? (
                  <>
                    <AppImage
                      src={displayImages[currentImageIndex]}
                      alt={`${product.name} — фото ${currentImageIndex + 1}`}
                      fill
                      variant="gallery"
                      sizes="(max-width: 768px) 90vw, 50vw"
                      className="object-cover"
                      priority={currentImageIndex === 0}
                      loading={currentImageIndex === 0 ? "eager" : "lazy"}
                      imageData={
                        currentImageIndex === 0
                          ? {
                              image_url: product.image,
                              image_thumb_url: product.imageThumbUrl,
                              image_medium_url: product.imageMediumUrl,
                              image_large_url: product.imageLargeUrl,
                              image_thumb_avif_url: product.imageThumbAvifUrl,
                              image_medium_avif_url: product.imageMediumAvifUrl,
                              image_large_avif_url: product.imageLargeAvifUrl,
                            }
                          : undefined
                      }
                    />
                    {displayImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          disabled={!canGoPrev}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-color-text-main transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main ${
                            canGoPrev ? "opacity-100 hover:opacity-70" : "opacity-50 cursor-not-allowed"
                          }`}
                          aria-label="Предыдущее фото"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          disabled={!canGoNext}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-color-text-main transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main ${
                            canGoNext ? "opacity-100 hover:opacity-70" : "opacity-50 cursor-not-allowed"
                          }`}
                          aria-label="Следующее фото"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {displayImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {displayImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/75"
                            }`}
                            aria-label={`Фото ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-color-text-secondary">
                    Нет фото
                  </div>
                )}
              </div>
            </div>

            {/* Информация о товаре */}
            <div className="flex flex-col">
              <h3 className="text-2xl font-semibold text-color-text-main mb-2">{product.name}</h3>

              {/* Цена */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-color-text-main">
                  {product.price.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              {/* Состав — показываем только если есть данные */}
              {product.composition && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-color-text-secondary mb-1">Состав:</p>
                  <p className="text-sm text-color-text-main leading-relaxed">{product.composition}</p>
                </div>
              )}

              {/* Категории — показываем только если есть данные, сразу под "Состав" */}
              {product.categories && product.categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-color-text-secondary">Категории: {product.categories.join(", ")}</p>
                </div>
              )}

              {/* Количество */}
              <div className="mb-6">
                <p className="text-sm font-medium text-color-text-secondary mb-2">Количество:</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDecreaseQuantity}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-outline-border)] bg-white text-color-text-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(31,42,31,0.06)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main"
                    aria-label="Уменьшить количество"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-base font-semibold text-color-text-main w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={handleIncreaseQuantity}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-outline-border)] bg-white text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main"
                    aria-label="Увеличить количество"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex flex-col gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3 px-4 rounded-full bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active text-white font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />В корзину
                </button>
                <button
                  type="button"
                  onClick={handleQuickBuy}
                  className="hidden md:block w-full py-3 px-4 rounded-full border border-[var(--color-outline-border)] bg-white hover:bg-[rgba(31,42,31,0.06)] active:bg-[rgba(31,42,31,0.1)] text-color-text-main font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
                >
                  Купить в 1 клик
                </button>
                <Link
                  href={buildProductUrl({ name: product.name, productSlug: product.slug ?? null })}
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-full text-center text-sm text-color-text-secondary hover:text-color-text-main font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
                >
                  Посмотреть детали
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка покупки в 1 клик */}
      <QuickBuyModal
        isOpen={quickBuyOpen}
        onClose={() => setQuickBuyOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          productPath: buildProductUrl({ name: product.name, productSlug: product.slug ?? null }),
        }}
      />
    </div>
  );

  return createPortal(content, document.body);
}
