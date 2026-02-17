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
    // Размеры без привязки к isMobile, чтобы не портить LCP (первая отрисовка до гидрации).
    // Браузер сам выберет размер по srcset/sizes; качество снижаем только в fallback-path.
    const isLazy = props.loading === "lazy" || (!props.priority && props.loading !== "eager");
    const sizeMap: Record<AppImageVariant, "thumb" | "medium" | "large"> = {
      card: isLazy ? "thumb" : "medium", // Превью при скролле — thumb, иначе medium
      thumb: "thumb",
      blog: "medium",
      gallery: "large",
      hero: "large",
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

    // Базовое качество 80; на мобильных чуть ниже для ускорения загрузки
    const base = 80;
    const mobileQ = isMobile ? 72 : base;

    switch (variant) {
      case "card":
        const isLazy = props.loading === "lazy" || (!props.priority && props.loading !== "eager");
        return isMobile ? 72 : (isLazy ? 76 : base); // превью при скролле — чуть ниже
      case "thumb":
        return isMobile ? 70 : 76;
      case "blog":
        return mobileQ;
      case "gallery":
        return base; // галерея товара — всегда 80
      case "hero":
        return mobileQ;
      default:
        return mobileQ;
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
