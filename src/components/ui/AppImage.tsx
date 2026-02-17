"use client";

import Image, { type ImageProps } from "next/image";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { OptimizedImage, createImageVariants, type OptimizedImageVariants } from "./OptimizedImage";

export type AppImageVariant = "card" | "hero" | "gallery" | "thumb" | "blog";

type AppImageProps = Omit<ImageProps, "quality" | "src"> & {
  /** Вариант использования изображения для автоматической настройки качества */
  variant?: AppImageVariant;
  /** Переопределение качества (если нужно явно указать) */
  quality?: number;
  /** URL изображения (для обратной совместимости) */
  src: string;
  /** Варианты изображения (thumb, medium, large в WebP/AVIF) - если есть, используется OptimizedImage */
  variants?: OptimizedImageVariants;
  /** Данные из БД для автоматического создания variants */
  imageData?: {
    image_url?: string | null;
    image_thumb_url?: string | null;
    image_medium_url?: string | null;
    image_large_url?: string | null;
    image_thumb_avif_url?: string | null;
    image_medium_avif_url?: string | null;
    image_large_avif_url?: string | null;
  };
};

/**
 * Обертка над next/image с автоматической настройкой качества по варианту использования.
 * Если доступны предгенерированные варианты (variants или imageData), использует OptimizedImage
 * для избежания ресайза "на лету". Иначе использует next/image с unoptimized для прямых ссылок.
 *
 * Варианты качества (используются только если нет готовых вариантов):
 * - card: 60-65 (карточки товаров в каталоге)
 * - thumb: 55-60 (миниатюры)
 * - blog: 65-70 (карточки блога)
 * - gallery: 75-80 (галерея товара, главное фото)
 * - hero: 75-80 (hero слайды, крупные баннеры)
 */
export function AppImage({ variant = "card", quality, src, variants, imageData, ...props }: AppImageProps) {
  // Определяем мобильное устройство для снижения качества на мобильных
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Если есть готовые варианты, используем OptimizedImage
  const optimizedVariants = variants || (imageData ? createImageVariants(imageData) : null);

  if (optimizedVariants && (optimizedVariants.thumb || optimizedVariants.medium || optimizedVariants.large)) {
    // Определяем размер и responsive настройки по варианту использования
    // На мобильных используем меньшие размеры для быстрой загрузки
    const isLazy = props.loading === "lazy" || (!props.priority && props.loading !== "eager");
    
    const sizeMap: Record<AppImageVariant, "thumb" | "medium" | "large"> = {
      // Карточки: на мобильных всегда thumb, на десктопе thumb для lazy (превью при скролле), medium для eager/priority
      card: isMobile ? "thumb" : (isLazy ? "thumb" : "medium"),
      thumb: "thumb", // Миниатюры: только thumb
      blog: isMobile ? "thumb" : "medium", // Блог: thumb на мобиле, medium на десктопе
      gallery: "large", // Галерея товара: всегда large (открытая карточка - высокое качество)
      hero: isMobile ? "medium" : "large", // Hero: medium на мобиле для быстрой загрузки, large на десктопе
    };

    // Responsive srcset для разных вариантов
    const responsiveMap: Record<AppImageVariant, boolean> = {
      card: true, // Каталог: адаптивный (thumb на мобиле, medium на десктопе)
      thumb: false, // Миниатюры: фиксированный размер
      blog: true, // Блог: адаптивный
      gallery: true, // Галерея: адаптивный (medium на мобиле, large на десктопе)
      hero: true, // Hero: адаптивный (medium на мобиле, large на десктопе)
    };

    return (
      <OptimizedImage
        variants={optimizedVariants}
        size={sizeMap[variant]}
        responsive={responsiveMap[variant]}
        priority={props.priority}
        loading={props.loading}
        className={props.className}
        alt={props.alt || ""}
        decoding={props.decoding}
        {...(props as any)}
      />
    );
  }

  // Dev warning: если нет imageData и это не специальный случай
  if (process.env.NODE_ENV === "development" && !imageData && !variants) {
    const isRemote = src.startsWith("http://") || src.startsWith("https://");
    // Предупреждаем только для remote изображений (Supabase Storage)
    // Исключаем placeholder изображения
    if (isRemote && !src.includes("placeholder")) {
      console.warn(
        `[AppImage] Missing imageData for optimized mode. Component: ${variant}, URL: ${src.substring(0, 50)}...`,
        "\nThis will load the original image (slow). Consider adding imageData prop."
      );
    }
  }

  // Fallback: используем next/image с unoptimized для избежания ресайза на лету
  // ВАЖНО: это fallback режим - оригинальное изображение будет загружаться полностью
  // Для production это нежелательно, но работает для обратной совместимости
  const getQuality = (): number => {
    if (quality !== undefined) return quality;

    // Снижаем качество на мобильных для быстрой загрузки
    const mobileReduction = isMobile ? 8 : 0; // Снижение на 8 единиц для мобильных

    switch (variant) {
      case "card":
        // Для карточек: снижаем качество на мобильных и для lazy-загрузки (превью в каталоге при скролле)
        const cardBase = 65;
        const isLazy = props.loading === "lazy" || (!props.priority && props.loading !== "eager");
        // На мобильных - снижаем на 8, при lazy-загрузке (превью) - снижаем на 5 для десктопа
        if (isMobile) return cardBase - mobileReduction;
        if (isLazy) return cardBase - 5; // Превью при скролле на десктопе - немного снижаем
        return cardBase; // Открытые карточки на десктопе - полное качество
      case "thumb":
        return 60 - (isMobile ? 5 : 0); // Миниатюры: меньше снижение
      case "blog":
        return 70 - (isMobile ? 8 : 0); // Блог: снижаем на мобильных
      case "gallery":
        return 75; // Галерея товара: высокое качество всегда (открытая карточка)
      case "hero":
        // Hero слайды: снижаем качество на мобильных для быстрой загрузки
        return 70 - mobileReduction;
      default:
        return 70 - (isMobile ? 5 : 0);
    }
  };

  // Remote images: используем оптимизацию Next.js (WebP/AVIF, ресайз под sizes) для LCP и PageSpeed.
  // Раньше был unoptimized из-за ресайза «на лету» — теперь кэш _next/image даёт быструю отдачу.
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  const defaultSizesByVariant: Record<AppImageVariant, string> = {
    hero: "(max-width: 768px) 100vw, (max-width: 1440px) 100vw, 1400px",
    card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    thumb: "160px",
    blog: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    gallery: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 480px",
  };
  const sizes = props.sizes ?? defaultSizesByVariant[variant];

  if (isRemote) {
    return <Image {...props} src={src} quality={getQuality()} sizes={sizes} />;
  }

  return <Image {...props} src={src} quality={getQuality()} sizes={sizes} />;
}
