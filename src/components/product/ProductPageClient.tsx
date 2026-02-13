"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PLACEHOLDER_IMAGE, isValidImageUrl } from "@/utils/imageUtils";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  Bell,
  Minus,
  Plus,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import type { Product } from "@/lib/products";
import type { ProductDetails } from "@/lib/productDetails";
import { Flower, getCartLineId } from "@/types/flower";
import { Breadcrumbs, BREADCRUMB_SPACING } from "@/components/ui/breadcrumbs";
import { PhoneInput, toE164, isValidPhone } from "@/components/ui/PhoneInput";
import { Container } from "@/components/layout/Container";
import { FullscreenViewer } from "./FullscreenViewer";
import { GiftHintModal } from "./GiftHintModal";
import { ContactMessengersRow } from "./ContactMessengersRow";
import { AddToOrderSection } from "./AddToOrderSection";
import { runFlyToHeader } from "@/utils/flyToHeader";
import { PreorderModal } from "@/components/cart/PreorderModal";
import { buildProductUrl } from "@/utils/buildProductUrl";
import { trackProductDetail, trackAddToCart } from "@/lib/metrika/ecommerce";

type ProductPageClientProps = {
  product: Product;
  productDetails: ProductDetails;
  addToOrderProducts: Product[];
};

/** Аккордеон-секция (single-open: при открытии нового — предыдущий закрывается) */
function AccordionItem({
  id: _id,
  title,
  children,
  isOpen,
  onToggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border-block">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between py-3 text-left">
        <span className="text-sm font-medium text-color-text-secondary uppercase tracking-wide">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-color-text-main transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-3" : "max-h-0"}`}
      >
        <div className="text-sm text-color-text-secondary leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/** Модалка "Купить в один клик" */
function QuickOrderModal({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: Product }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneE164 = toE164(phone);
  const isValid = name.trim() && phoneE164 !== "" && isValidPhone(phoneE164);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price,
          customerName: name,
          customerPhone: phoneE164,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Ошибка при оформлении заказа");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-color-text-secondary hover:text-color-text-main"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-color-text-main/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-color-text-main" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-color-text-main mb-2">Заявка отправлена!</h3>
            <p className="text-color-text-secondary text-sm">
              Мы свяжемся с вами в ближайшее время для подтверждения заказа.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 text-white rounded-full transition-colors bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-color-text-main mb-1">Купить в один клик</h2>
            <p className="text-sm text-color-text-secondary mb-6">
              Оставьте контакты — мы перезвоним для оформления заказа
            </p>

            {/* Товар */}
            <div className="flex items-center gap-3 p-3 bg-[rgba(31,42,31,0.06)] rounded-lg mb-6">
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-[#ece9e2]">
                <Image
                  src={isValidImageUrl(product.image) ? product.image! : PLACEHOLDER_IMAGE}
                  alt={product.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-color-text-main truncate">{product.title}</p>
                <p className="text-sm font-semibold text-color-text-main">{product.price.toLocaleString("ru-RU")} ₽</p>
              </div>
            </div>

            {/* Форма */}
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block"
                />
              </div>
              <div>
                <PhoneInput value={phone} onChange={setPhone} label="Телефон" required />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full py-3 text-white font-medium rounded-full transition-colors disabled:cursor-not-allowed bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active disabled:bg-accent-btn-disabled-bg disabled:text-accent-btn-disabled-text"
              >
                {loading ? "Отправка..." : "Заказать"}
              </button>

              <p className="text-xs text-color-text-secondary text-center">
                Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProductPageClient({ product, productDetails, addToOrderProducts }: ProductPageClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [giftHintOpen, setGiftHintOpen] = useState(false);
  const [preorderOpen, setPreorderOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, state: cartState, updateQuantity, openCartDrawer } = useCart();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();

  const hasVariants = product.variants && product.variants.length > 0;
  const defaultVariantId = hasVariants ? product.variants![0].id : null;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(defaultVariantId);
  const selectedVariant =
    hasVariants && selectedVariantId != null
      ? (product.variants!.find((v) => v.id === selectedVariantId) ?? product.variants![0])
      : null;
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayComposition = selectedVariant ? (selectedVariant.composition ?? null) : (product.composition ?? null);
  const displaySizeHeight = selectedVariant ? (selectedVariant.height_cm ?? null) : (product.sizeHeightCm ?? null);
  const displaySizeWidth = selectedVariant ? (selectedVariant.width_cm ?? null) : (product.sizeWidthCm ?? null);

  // Эффективный вариант для витрины: выбранный или первый
  const effectiveVariant =
    hasVariants && product.variants && product.variants.length > 0
      ? selectedVariant ?? product.variants[0]!
      : null;

  // Флаг предзаказа на странице товара:
  // приоритет у варианта, если он есть; иначе — у товара
  const isPreorder = effectiveVariant ? Boolean(effectiveVariant.isPreorder) : Boolean(product.isPreorder);
  const productPath = buildProductUrl({ name: product.title, productSlug: product.slug });

  useEffect(() => {
    if (hasVariants && selectedVariantId != null && !product.variants!.some((v) => v.id === selectedVariantId)) {
      setSelectedVariantId(product.variants![0].id);
    }
  }, [product.variants, hasVariants, selectedVariantId]);

  // Client-side update metadata when variant changes (variant has its own SEO fields)
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    if (!hasVariants || !selectedVariant) return;
    const v = selectedVariant as {
      seo_title?: string | null;
      seo_description?: string | null;
      og_image?: string | null;
    };
    const title = v.seo_title?.trim();
    const desc = v.seo_description?.trim();

    if (title) {
      document.title = `${title} | The Ame`;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && desc) {
      metaDesc.setAttribute("content", desc);
    }
  }, [hasVariants, selectedVariant]);

  // Храним предыдущий product.id чтобы сбросить индекс только при смене товара
  const prevProductId = useRef(product.id);

  useEffect(() => {
    if (prevProductId.current !== product.id) {
      setSelectedImageIndex(0);
      prevProductId.current = product.id;
      if (hasVariants) setSelectedVariantId(product.variants![0].id);
    }
  }, [product.id, hasVariants, product.variants]);

  const flower: Flower & { variantId?: number | null; variantTitle?: string | null } = {
    id: product.id,
    name: product.title,
    price: displayPrice,
    image: product.image,
    description: product.shortDescription,
    category: "Разное",
    inStock: true,
    quantity: 1,
    colors: [],
    size: "medium",
    occasion: [],
    slug: product.slug,
    categorySlug: product.categorySlug ?? null,
    // Для корзины/анимаций учитываем предзаказ по выбранному/первому варианту
    isPreorder,
    ...(effectiveVariant && {
      variantId: effectiveVariant.id,
      variantTitle: effectiveVariant.name ?? undefined,
    }),
  };

  // Массив изображений: product.image + product.images; невалидные заменяем placeholder
  const base = product.image?.trim();
  const extra = product.images ?? [];
  const seen = new Set<string>();
  const images: string[] = [];
  const first = isValidImageUrl(base) ? base! : PLACEHOLDER_IMAGE;
  images.push(first);
  seen.add(first);
  for (const url of extra) {
    const u = typeof url === "string" ? url.trim() : "";
    if (u && isValidImageUrl(u) && !seen.has(u)) {
      images.push(u);
      seen.add(u);
    }
  }
  const imagesLen = images.length;
  const hasMultipleImages = imagesLen > 1;

  // Циклическое переключение стрелками
  const goToPrev = () => {
    if (imagesLen <= 1) return;
    setSelectedImageIndex((i) => (i === 0 ? imagesLen - 1 : i - 1));
  };

  const goToNext = () => {
    if (imagesLen <= 1) return;
    setSelectedImageIndex((i) => (i === imagesLen - 1 ? 0 : i + 1));
  };

  const lineId = getCartLineId(flower);

  // Просмотр карточки товара (detail) — один раз при монтировании на клиенте
  useEffect(() => {
    trackProductDetail({
      id: product.id,
      name: product.title,
      price: displayPrice,
      category: product.categories?.[0],
      variant: effectiveVariant ? effectiveVariant.name ?? undefined : undefined,
    });
  }, [product.id, product.title, displayPrice, product.categories, effectiveVariant]);

  const handleAddToCart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Проверяем, есть ли эта позиция (товар + вариант) уже в корзине
    const existingItem = cartState.items.find((item) => item.id === lineId);
    if (existingItem) {
      updateQuantity(lineId, existingItem.cartQuantity + quantity);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(flower);
      }
    }
    trackAddToCart(
      {
        id: flower.id,
        name: flower.name,
        price: flower.price,
        category: flower.category,
        variant: flower.variantTitle ?? undefined,
      },
      quantity
    );
    // Запускаем анимацию полёта иконки к корзине
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      runFlyToHeader("cart", rect);
    }
  };

  const handleBuyNow = (e?: React.MouseEvent<HTMLButtonElement>) => {
    const existingItem = cartState.items.find((item) => item.id === lineId);
    if (existingItem) {
      updateQuantity(lineId, existingItem.cartQuantity + quantity);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(flower);
      }
    }
    trackAddToCart(
      {
        id: flower.id,
        name: flower.name,
        price: flower.price,
        category: flower.category,
        variant: flower.variantTitle ?? undefined,
      },
      quantity
    );
    // Запускаем анимацию полёта иконки к корзине
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      runFlyToHeader("cart", rect);
    }
    // Открываем модалку корзины вместо редиректа
    openCartDrawer();
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    const wasInFavorites = isInFavorites;
    toggleFavorite(product.id.toString());
    // Запускаем анимацию полёта иконки к избранному (только при добавлении)
    if (!wasInFavorites && e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      runFlyToHeader("favorite", rect);
    }
  };

  const isInFavorites = isFavorite(product.id.toString());

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  // Аккордеон: только один пункт открыт за раз, "Описание" по умолчанию
  const [openedAccordion, setOpenedAccordion] = useState<string | null>("Описание");

  const handleAccordionToggle = (id: string) => {
    setOpenedAccordion((prev) => (prev === id ? null : id));
  };

  // Хлебные крошки: Главная / Каталог / Товар (Каталог ведёт на /magazin)
  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/magazin" },
    { label: product.title },
  ];

  return (
    <>
      <div className="bg-page-bg">
        {/* Контейнер с нормальным отступом сверху, компактным снизу */}
        <Container className="pt-3 pb-8 md:pt-4 md:pb-10">
          {/* Хлебные крошки — минимальный отступ до контента */}
          <Breadcrumbs items={breadcrumbItems} className={BREADCRUMB_SPACING} />

          {/* Основной контент: 2 колонки на desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-6 lg:gap-10 items-start">
            {/* Левая колонка — миниатюры + большое фото */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 w-full">
              {/* Миниатюры: на mobile под основным фото (order-2), на lg слева от фото (order-1) */}
              {imagesLen > 0 && (
                <div className="flex flex-row lg:flex-col gap-2.5 order-2 lg:order-1 overflow-x-auto lg:overflow-x-visible overflow-y-auto lg:max-h-[min(620px,80vh)] shrink-0 p-1 scrollbar-hide">
                  {images.map((src, idx) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 lg:w-16 lg:h-16 shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                        idx === selectedImageIndex
                          ? "outline outline-2 outline-offset-2 outline-color-text-main"
                          : "ring-1 ring-border-block hover:ring-border-block-hover"
                      }`}
                    >
                      <Image
                        src={src}
                        alt={`${product.title} — фото ${idx + 1}`}
                        fill
                        sizes="64px"
                        quality={88}
                        className="object-cover object-center"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Большое фото со слайдером: на mobile первым (order-1), на lg справа от миниатюр (order-2) */}
              <div
                className="relative flex-1 min-w-0 order-1 lg:order-2"
                style={{
                  aspectRatio: "1 / 1",
                  maxWidth: "min(620px, 100%)",
                  maxHeight: "min(620px, 80vh)",
                }}
              >
                {/* Слайдер с fade (300ms) — клик открывает fullscreen */}
                <button
                  type="button"
                  onClick={() => imagesLen > 0 && setFullscreenOpen(true)}
                  className="relative w-full h-full cursor-zoom-in"
                  aria-label="Открыть в полноэкранном режиме"
                >
                  <div className="relative w-full h-full">
                    {imagesLen > 0 ? (
                      images.map((src, idx) => (
                        <div
                          key={src}
                          className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                          style={{
                            opacity: idx === selectedImageIndex ? 1 : 0,
                            pointerEvents: idx === selectedImageIndex ? "auto" : "none",
                          }}
                        >
                          <Image
                            src={src}
                            alt={`${product.title} — фото ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 700px"
                            className="object-contain object-center rounded-xl"
                            priority={idx === 0}
                            fetchPriority={idx === 0 ? "high" : undefined}
                            quality={idx === 0 ? 88 : 85}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[rgba(31,42,31,0.06)] rounded-xl text-color-text-secondary text-sm">
                        Нет фото
                      </div>
                    )}
                  </div>
                </button>

                {/* Виджет размеров поверх фото (только на карточке, не в fullscreen) */}
                {(displaySizeWidth != null || displaySizeHeight != null) && (
                  <div
                    className="absolute bottom-4 right-4 z-10 rounded-lg px-2.5 py-1.5 pointer-events-none"
                    style={{
                      backgroundColor: "rgba(111, 131, 99, 0.75)",
                      color: "#FFFFFF",
                    }}
                    aria-hidden
                  >
                    <div className="flex flex-col gap-0.5 text-xs font-medium leading-tight">
                      {displaySizeWidth != null && (
                        <span className="flex items-center gap-1 text-white">
                          <ArrowLeftRight className="w-3 h-3 opacity-95 shrink-0" aria-hidden />
                          <span>{displaySizeWidth} см</span>
                        </span>
                      )}
                      {displaySizeHeight != null && (
                        <span className="flex items-center gap-1 text-white">
                          <ArrowUpDown className="w-3 h-3 opacity-95 shrink-0" aria-hidden />
                          <span>{displaySizeHeight} см</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Стрелки влево/вправо — всегда активны при >1 фото (циклические) */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={goToPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all z-10 hover:scale-105"
                      aria-label="Предыдущее фото"
                    >
                      <ChevronLeft className="w-5 h-5 text-color-text-main" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all z-10 hover:scale-105"
                      aria-label="Следующее фото"
                    >
                      <ChevronRight className="w-5 h-5 text-color-text-main" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Правая колонка — информация */}
            <div>
              {/* Заголовок */}
              <h1 className="text-xl md:text-2xl font-semibold text-color-text-main mb-2">
                {product.title.toUpperCase()}
              </h1>

              {/* Вариант (если вариантный товар) */}
              {hasVariants && (
                <div className="mb-4">
                  <span className="text-sm text-color-text-secondary block mb-1.5">Вариант</span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border border-[var(--color-outline-border)] ${
                          selectedVariantId === v.id
                            ? "bg-btn-chip-active text-color-text-main"
                            : "bg-white text-color-text-main hover:bg-[rgba(31,42,31,0.06)]"
                        }`}
                      >
                        {v.name} — {v.price.toLocaleString("ru-RU")} ₽
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Цена и блок действий в едином контейнере */}
              <div className="mb-4">
                {/* Цена */}
                <div className="text-lg md:text-xl font-medium text-color-text-main mb-4">
                  {displayPrice.toLocaleString("ru-RU")} ₽
                </div>

                {/* Блок действий */}
                <div>
                  {/* Первая строка: количество, CTA кнопки, избранное. На mobile — компактно в одну строку. */}
                  <div className="flex flex-row items-center gap-1.5 md:gap-2 mb-4 flex-nowrap">
                    {/* Селектор количества */}
                    <div className="flex items-center border border-border-block rounded-lg bg-white overflow-hidden flex-shrink-0 h-8 md:h-9">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="px-1.5 md:px-2 py-1 md:py-1.5 text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-r border-border-block"
                        aria-label="Уменьшить количество"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="px-2 md:px-2.5 py-1 md:py-1.5 text-xs md:text-sm font-medium text-color-text-main min-w-[1.75rem] md:min-w-[2rem] text-center border-r border-border-block">
                        {quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="px-1.5 md:px-2 py-1 md:py-1.5 text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors"
                        aria-label="Увеличить количество"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* CTA кнопки: на mobile уменьшены (h-8, text-xs, px-2), в одну строку */}
                    <div className="flex flex-1 gap-1.5 md:gap-2 min-w-0 min-h-0">
                      {isPreorder ? (
                        <button
                          type="button"
                          onClick={() => setPreorderOpen(true)}
                          className="flex-1 min-h-[36px] md:min-h-[44px] h-8 md:h-9 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium uppercase transition-all flex items-center justify-center gap-2 btn-accent min-w-0 touch-manipulation"
                        >
                          Сделать предзаказ
                        </button>
                      ) : (
                        <>
                          {/* Кнопка "В КОРЗИНУ" - зелёная залитая */}
                          <button
                            onClick={handleAddToCart}
                            className="flex-1 min-h-[36px] md:min-h-[44px] h-8 md:h-9 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium uppercase transition-all flex items-center justify-center gap-2 btn-accent min-w-0 touch-manipulation"
                          >
                            В КОРЗИНУ
                          </button>

                          {/* Кнопка "КУПИТЬ СЕЙЧАС" */}
                          <button
                            onClick={handleBuyNow}
                            className="flex-1 min-h-[36px] md:min-h-[44px] h-8 md:h-9 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium uppercase transition-all btn-product-cta min-w-0 touch-manipulation"
                          >
                            КУПИТЬ СЕЙЧАС
                          </button>
                        </>
                      )}
                    </div>

                    {/* Кнопка избранного — в одну строку с CTA, на mobile компактнее */}
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className={`btn-favorite group h-8 w-8 min-h-[36px] min-w-[36px] md:h-9 md:min-h-[44px] md:w-9 md:min-w-[44px] flex items-center justify-center flex-shrink-0 ${isInFavorites ? "selected" : ""}`}
                      aria-label={isInFavorites ? "Убрать из избранного" : "Добавить в избранное"}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isInFavorites
                            ? "fill-[var(--color-text-main)] text-[var(--color-text-main)]"
                            : "text-[var(--color-text-main)] group-hover:text-[var(--header-foreground)]"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>

                  {/* Вторая строка: "Намекнуть о подарке" */}
                  <button
                    type="button"
                    onClick={() => setGiftHintOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-color-text-main hover:text-color-text-secondary transition-colors w-fit min-h-[40px]"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span className="relative after:absolute after:left-0 after:-bottom-[3px] after:h-[1px] after:w-full after:bg-[var(--header-foreground)] after:origin-left after:transition-transform after:duration-300 after:ease-out after:scale-x-0 hover:after:scale-x-100">
                      НАМЕКНУТЬ О ПОДАРКЕ
                    </span>
                  </button>

                  {/* Строка контактов: СВЯЗАТЬСЯ С НАМИ + WhatsApp / Telegram / МАХ */}
                  <ContactMessengersRow />
                </div>
              </div>

              {/* Аккордеон-секции (single-open) */}
              <div className="mt-4">
                {product.shortDescription && (
                  <AccordionItem
                    id="Описание"
                    title="Описание"
                    isOpen={openedAccordion === "Описание"}
                    onToggle={() => handleAccordionToggle("Описание")}
                  >
                    <p className="whitespace-pre-line">{product.shortDescription}</p>
                  </AccordionItem>
                )}

                {displayComposition && displayComposition.trim() ? (
                  <AccordionItem
                    id="Состав"
                    title="Состав"
                    isOpen={openedAccordion === "Состав"}
                    onToggle={() => handleAccordionToggle("Состав")}
                  >
                    <p className="whitespace-pre-line">{displayComposition}</p>
                  </AccordionItem>
                ) : hasVariants || product.composition != null ? (
                  <AccordionItem
                    id="Состав"
                    title="Состав"
                    isOpen={openedAccordion === "Состав"}
                    onToggle={() => handleAccordionToggle("Состав")}
                  >
                    <p className="text-color-text-secondary">—</p>
                  </AccordionItem>
                ) : null}

                {(displaySizeHeight != null && displaySizeHeight > 0) ||
                (displaySizeWidth != null && displaySizeWidth > 0) ? (
                  <AccordionItem
                    id="Размер"
                    title="Размер"
                    isOpen={openedAccordion === "Размер"}
                    onToggle={() => handleAccordionToggle("Размер")}
                  >
                    <p>
                      {[
                        displaySizeHeight != null && displaySizeHeight > 0 ? `Высота ${displaySizeHeight} см` : null,
                        displaySizeWidth != null && displaySizeWidth > 0 ? `Ширина ${displaySizeWidth} см` : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </AccordionItem>
                ) : hasVariants ? (
                  <AccordionItem
                    id="Размер"
                    title="Размер"
                    isOpen={openedAccordion === "Размер"}
                    onToggle={() => handleAccordionToggle("Размер")}
                  >
                    <p className="text-color-text-secondary">—</p>
                  </AccordionItem>
                ) : null}

                <AccordionItem
                  id="Подарок при заказе"
                  title="Подарок при заказе"
                  isOpen={openedAccordion === "Подарок при заказе"}
                  onToggle={() => handleAccordionToggle("Подарок при заказе")}
                >
                  <p className="whitespace-pre-line">{productDetails.kit.trim() || "—"}</p>
                </AccordionItem>

                <AccordionItem
                  id="Доставка и оплата"
                  title="Доставка и оплата"
                  isOpen={openedAccordion === "Доставка и оплата"}
                  onToggle={() => handleAccordionToggle("Доставка и оплата")}
                >
                  <p>
                    Доставка цветов по Сочи доступна в любое время суток. Вы можете оформить заказ заранее или в день
                    получения, указав удобный интервал доставки. Среднее время ожидания — от 60 минут. Подробные условия
                    и стоимость доставки смотрите на странице{" "}
                    <Link href="/delivery-and-payments" className="text-color-text-main underline hover:no-underline">
                      «Доставка и оплата»
                    </Link>
                    .
                  </p>
                </AccordionItem>

                <AccordionItem
                  id="Инструкция по уходу"
                  title="Инструкция по уходу"
                  isOpen={openedAccordion === "Инструкция по уходу"}
                  onToggle={() => handleAccordionToggle("Инструкция по уходу")}
                >
                  <p>
                    Подробные шаги по уходу за цветами мы собрали на отдельной странице —{" "}
                    <Link
                      href="/instrukciya-po-uhodu-za-tsvetami"
                      className="text-color-text-main underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--color-text-main)] rounded-sm"
                    >
                      «Инструкцию по уходу»
                    </Link>
                    .
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <AddToOrderSection products={addToOrderProducts} />

      {/* Модалка быстрого заказа */}
      <QuickOrderModal isOpen={quickOrderOpen} onClose={() => setQuickOrderOpen(false)} product={product} />

      {/* Модалка "Намекнуть о подарке" */}
      <GiftHintModal isOpen={giftHintOpen} onClose={() => setGiftHintOpen(false)} product={product} />

      {/* Модалка предзаказа */}
      <PreorderModal
        isOpen={preorderOpen}
        onClose={() => setPreorderOpen(false)}
        product={{
          id: product.id,
          name: product.title,
          image: product.image,
          price: displayPrice,
          productPath,
          variantId: effectiveVariant?.id,
          variantTitle: effectiveVariant?.name ?? null,
        }}
      />

      <FullscreenViewer
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        images={images}
        currentIndex={selectedImageIndex}
        onIndexChange={setSelectedImageIndex}
        productTitle={product.title}
      />
    </>
  );
}
