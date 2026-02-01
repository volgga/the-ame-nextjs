"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import { Flower } from "@/types/flower";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FullscreenViewer } from "./FullscreenViewer";

type ProductPageClientProps = {
  product: Product;
};

/** Аккордеон-секция (single-open: при открытии нового — предыдущий закрывается) */
function AccordionItem({
  id,
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
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-color-text-secondary uppercase tracking-wide">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-color-text-main transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 pb-3" : "max-h-0"
        }`}
      >
        <div className="text-sm text-color-text-secondary leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/** Модалка "Купить в один клик" */
function QuickOrderModal({
  isOpen,
  onClose,
  product,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 (");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("7")) value = value.slice(1);
    if (value.length > 10) value = value.slice(0, 10);

    let formatted = "+7 (";
    if (value.length > 0) formatted += value.slice(0, 3);
    if (value.length > 3) formatted += ") " + value.slice(3, 6);
    if (value.length > 6) formatted += "-" + value.slice(6, 8);
    if (value.length > 8) formatted += "-" + value.slice(8, 10);

    setPhone(formatted);
  };

  const isValid = name.trim() && phone.length >= 18;

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
          customerPhone: phone,
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      
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
            <h2 className="text-xl font-semibold text-color-text-main mb-1">
              Купить в один клик
            </h2>
            <p className="text-sm text-color-text-secondary mb-6">
              Оставьте контакты — мы перезвоним для оформления заказа
            </p>

            {/* Товар */}
            <div className="flex items-center gap-3 p-3 bg-[rgba(31,42,31,0.06)] rounded-lg mb-6">
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-color-text-main truncate">{product.title}</p>
                <p className="text-sm font-semibold text-color-text-main">
                  {product.price.toLocaleString("ru-RU")} ₽
                </p>
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
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇷🇺</span>
                <input
                  type="tel"
                  placeholder="+7 (000) 000-00-00"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-12 pr-4 py-3 border border-border-block rounded-lg bg-white text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,99,0.5)] focus:border-border-block"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

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

export function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const { addToCart } = useCart();

  const hasVariants = product.variants && product.variants.length > 0;
  const defaultVariantId = hasVariants ? product.variants![0].id : null;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(defaultVariantId);
  const selectedVariant = hasVariants && selectedVariantId != null
    ? product.variants!.find((v) => v.id === selectedVariantId) ?? product.variants![0]
    : null;
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayComposition = selectedVariant ? (selectedVariant.composition ?? null) : (product.composition ?? null);
  const displaySizeHeight = selectedVariant ? (selectedVariant.height_cm ?? null) : (product.sizeHeightCm ?? null);
  const displaySizeWidth = selectedVariant ? (selectedVariant.width_cm ?? null) : (product.sizeWidthCm ?? null);

  useEffect(() => {
    if (hasVariants && selectedVariantId != null && !product.variants!.some((v) => v.id === selectedVariantId)) {
      setSelectedVariantId(product.variants![0].id);
    }
  }, [product.variants, hasVariants, selectedVariantId]);

  // Храним предыдущий product.id чтобы сбросить индекс только при смене товара
  const prevProductId = useRef(product.id);

  useEffect(() => {
    if (prevProductId.current !== product.id) {
      setSelectedImageIndex(0);
      prevProductId.current = product.id;
      if (hasVariants) setSelectedVariantId(product.variants![0].id);
    }
  }, [product.id, hasVariants, product.variants]);

  const flower: Flower = {
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
    isPreorder: product.isPreorder ?? false,
  };

  // Массив изображений: всегда начинается с product.image, затем product.images (без дублей)
  const base = product.image?.trim() || null;
  const extra = product.images ?? [];
  const seen = new Set<string>();
  const images: string[] = [];
  if (base) {
    images.push(base);
    seen.add(base);
  }
  for (const url of extra) {
    const u = typeof url === "string" ? url.trim() : "";
    if (u && !seen.has(u)) {
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

  const handleAddToCart = () => {
    addToCart(flower);
  };

  // Аккордеон: только один пункт открыт за раз, "Описание" по умолчанию
  const [openedAccordion, setOpenedAccordion] = useState<string | null>("Описание");

  const handleAccordionToggle = (id: string) => {
    setOpenedAccordion((prev) => (prev === id ? null : id));
  };

  // Хлебные крошки
  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/posmotret-vse-tsvety" },
    { label: product.title },
  ];

  return (
    <>
      <div className="bg-white">
        {/* Контейнер с нормальным отступом сверху, компактным снизу */}
        <div className="container mx-auto px-4 pt-5 pb-8 md:pt-6 md:pb-10">
          {/* Хлебные крошки — минимальный отступ до контента */}
          <Breadcrumbs items={breadcrumbItems} className="mb-2" />

          {/* Основной контент: 2 колонки на desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-6 lg:gap-10 items-start">
            {/* Левая колонка — миниатюры + большое фото */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 w-full">
              {/* Миниатюры: вертикальная лента на desktop слева, горизонтальная на mobile сверху */}
              {imagesLen > 0 && (
                <div className="flex flex-row lg:flex-col gap-2.5 order-1 lg:order-1 overflow-x-auto lg:overflow-x-visible overflow-y-auto lg:max-h-[min(620px,80vh)] shrink-0 p-1">
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
                        className="object-cover object-center"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Большое фото со слайдером */}
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
                            sizes="(max-width: 1024px) 100vw, 46vw"
                            className="object-contain object-center rounded-xl"
                            priority={idx === 0}
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
                          <span className="text-[10px] opacity-95" aria-hidden>↔</span>
                          <span>{displaySizeWidth} см</span>
                        </span>
                      )}
                      {displaySizeHeight != null && (
                        <span className="flex items-center gap-1 text-white">
                          <span className="text-[10px] opacity-95" aria-hidden>↕</span>
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
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedVariantId === v.id
                            ? "bg-accent-btn text-white"
                            : "border border-border-block text-color-text-main hover:bg-[rgba(31,42,31,0.06)]"
                        }`}
                      >
                        {v.name} — {v.price.toLocaleString("ru-RU")} ₽
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Цена (для обычного товара или выбранного варианта) */}
              <div className="text-lg md:text-xl font-medium text-color-text-main mb-5">
                {displayPrice.toLocaleString("ru-RU")} ₽
              </div>

              {/* Кнопки */}
              <div className="flex flex-col gap-2 mb-6 max-w-[300px]">
                <button
                  onClick={handleAddToCart}
                  className="w-full h-10 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                >
                  <ShoppingBag className="w-4 h-4" />
                  В корзину
                </button>

                <button
                  onClick={() => setQuickOrderOpen(true)}
                  className="w-full h-10 rounded-lg text-sm font-medium border border-outline-btn-border text-color-text-main bg-transparent hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg transition-colors"
                >
                  Купить в один клик
                </button>
              </div>

              {/* Аккордеон-секции (single-open) */}
              <div className="border-t border-border-block">
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

                {(displayComposition && displayComposition.trim()) ? (
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

                {(displaySizeHeight != null && displaySizeHeight > 0) || (displaySizeWidth != null && displaySizeWidth > 0) ? (
                  <AccordionItem
                    id="Размер"
                    title="Размер"
                    isOpen={openedAccordion === "Размер"}
                    onToggle={() => handleAccordionToggle("Размер")}
                  >
                    <p>
                      Размер:{" "}
                      {[
                        displaySizeHeight != null && displaySizeHeight > 0
                          ? `высота ${displaySizeHeight} см`
                          : null,
                        displaySizeWidth != null && displaySizeWidth > 0
                          ? `ширина ${displaySizeWidth} см`
                          : null,
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
                  id="Комплект"
                  title="Комплект"
                  isOpen={openedAccordion === "Комплект"}
                  onToggle={() => handleAccordionToggle("Комплект")}
                >
                  <ul className="space-y-1">
                    <li>• Букет в авторской упаковке</li>
                    <li>• Подкормка для цветов</li>
                    <li>• Открытка (по запросу)</li>
                  </ul>
                </AccordionItem>

                <AccordionItem
                  id="Доставка и оплата"
                  title="Доставка и оплата"
                  isOpen={openedAccordion === "Доставка и оплата"}
                  onToggle={() => handleAccordionToggle("Доставка и оплата")}
                >
                  <div className="space-y-2">
                    <p>
                      <strong>Доставка по Сочи:</strong> от 300 ₽, бесплатно от 4 000 ₽.
                    </p>
                    <p>
                      <strong>Время:</strong> 10:00–22:00. Ночная — по договорённости.
                    </p>
                    <p>
                      <strong>Оплата:</strong> онлайн или курьеру.
                    </p>
                  </div>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка быстрого заказа */}
      <QuickOrderModal
        isOpen={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
        product={product}
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
