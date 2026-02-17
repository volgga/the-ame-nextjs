import Image, { type ImageProps } from "next/image";
import { type ComponentPropsWithoutRef } from "react";
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
  // Если есть готовые варианты, используем OptimizedImage
  const optimizedVariants = variants || (imageData ? createImageVariants(imageData) : null);

  if (optimizedVariants && (optimizedVariants.thumb || optimizedVariants.medium || optimizedVariants.large)) {
    // Определяем размер и responsive настройки по варианту использования
    const sizeMap: Record<AppImageVariant, "thumb" | "medium" | "large"> = {
      card: "medium", // Каталог: medium с srcset thumb+medium
      thumb: "thumb", // Миниатюры: только thumb
      blog: "medium", // Блог карточки: medium с srcset thumb+medium
      gallery: "large", // Галерея товара: large с srcset medium+large
      hero: "large", // Hero слайды: large с srcset medium+large
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

    switch (variant) {
      case "card":
        return 65; // Оптимизировано для PageSpeed (было 62)
      case "thumb":
        return 60; // Оптимизировано для PageSpeed (было 58)
      case "blog":
        return 70; // Оптимизировано для PageSpeed (было 68)
      case "gallery":
        return 75; // Снижено для PageSpeed (было 78)
      case "hero":
        return 75; // Снижено для PageSpeed (было 78)
      default:
        return 70; // Оптимизировано для PageSpeed (было 75)
    }
  };

  // Для remote images отключаем оптимизацию Next.js, чтобы избежать ресайза на лету
  // Используем прямую ссылку на изображение
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  if (isRemote) {
    // Для remote images используем unoptimized, чтобы не было ресайза на лету
    return <Image {...props} src={src} quality={getQuality()} unoptimized={true} />;
  }

  return <Image {...props} src={src} quality={getQuality()} />;
}
