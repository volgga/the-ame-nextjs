/**
 * Компонент для рендеринга оптимизированных изображений с предгенерированными размерами
 * Использует <picture> с AVIF/WebP вместо next/image для избежания ресайза "на лету"
 */

import { type ComponentPropsWithoutRef } from "react";

export type ImageSize = "thumb" | "medium" | "large";

export interface OptimizedImageVariants {
  /** URL оригинального изображения (fallback) */
  original: string;
  /** URL превью ~320px (WebP) */
  thumb?: string | null;
  /** URL среднего размера ~768px (WebP) */
  medium?: string | null;
  /** URL большого размера ~1400px (WebP) */
  large?: string | null;
  /** URL превью ~320px (AVIF, опционально) */
  thumbAvif?: string | null;
  /** URL среднего размера ~768px (AVIF, опционально) */
  mediumAvif?: string | null;
  /** URL большого размера ~1400px (AVIF, опционально) */
  largeAvif?: string | null;
}

export interface OptimizedImageProps extends Omit<ComponentPropsWithoutRef<"img">, "src" | "srcSet"> {
  /** Варианты изображения (thumb, medium, large в WebP и AVIF) */
  variants: OptimizedImageVariants;
  /** Размер для использования (по умолчанию определяется автоматически) */
  size?: ImageSize;
  /** Использовать srcset для адаптивности (по умолчанию true) */
  responsive?: boolean;
  /** Приоритет загрузки (для LCP изображений) */
  priority?: boolean;
  /** Lazy loading (по умолчанию true, кроме priority) */
  loading?: "lazy" | "eager";
  /** Hint для браузера: размер отображения (для загрузки меньших изображений на мобилках) */
  sizes?: string;
  /** Заполнить родителя (position: relative); для CLS требуется aspect-ratio на родителе */
  fill?: boolean;
}

/**
 * Определяет оптимальный размер изображения на основе контекста использования
 */
function getOptimalSize(size?: ImageSize, responsive = true): ImageSize {
  if (size) return size;
  // По умолчанию используем medium для адаптивности
  return responsive ? "medium" : "large";
}

/**
 * Генерирует srcset для адаптивного изображения
 */
function generateSrcSet(
  variants: OptimizedImageVariants,
  format: "webp" | "avif",
  responsive: boolean
): string {
  const srcset: string[] = [];

  if (responsive) {
    // Для адаптивности используем все доступные размеры
    if (variants.thumb && format === "webp") {
      srcset.push(`${variants.thumb} 320w`);
    }
    if (variants.thumbAvif && format === "avif") {
      srcset.push(`${variants.thumbAvif} 320w`);
    }
    if (variants.medium && format === "webp") {
      srcset.push(`${variants.medium} 768w`);
    }
    if (variants.mediumAvif && format === "avif") {
      srcset.push(`${variants.mediumAvif} 768w`);
    }
    if (variants.large && format === "webp") {
      srcset.push(`${variants.large} 1400w`);
    }
    if (variants.largeAvif && format === "avif") {
      srcset.push(`${variants.largeAvif} 1400w`);
    }
  } else {
    // Используем только один размер
    const optimalSize = getOptimalSize();
    if (format === "webp") {
      const url =
        optimalSize === "thumb"
          ? variants.thumb
          : optimalSize === "medium"
            ? variants.medium
            : variants.large;
      if (url) srcset.push(url);
    } else {
      const url =
        optimalSize === "thumb"
          ? variants.thumbAvif
          : optimalSize === "medium"
            ? variants.mediumAvif
            : variants.largeAvif;
      if (url) srcset.push(url);
    }
  }

  return srcset.join(", ");
}

/**
 * Получает fallback URL (WebP или оригинал)
 */
function getFallbackUrl(variants: OptimizedImageVariants, size: ImageSize): string {
  if (size === "thumb" && variants.thumb) return variants.thumb;
  if (size === "medium" && variants.medium) return variants.medium;
  if (size === "large" && variants.large) return variants.large;
  return variants.original;
}

/** Sizes по умолчанию: на мобилках грузятся меньшие разрешения (фикс 768px для 455px контейнера) */
const DEFAULT_SIZES = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 400px";

export function OptimizedImage({
  variants,
  size,
  responsive = true,
  priority = false,
  loading,
  className,
  alt = "",
  sizes: sizesProp,
  fill,
  ...props
}: OptimizedImageProps) {
  const optimalSize = getOptimalSize(size, responsive);
  const fallbackUrl = getFallbackUrl(variants, optimalSize);
  const loadingAttr = loading ?? (priority ? "eager" : "lazy");
  const decoding = props.decoding ?? "async";

  // Если нет вариантов, используем оригинал как обычный img
  if (!variants.thumb && !variants.medium && !variants.large) {
    return (
      <img
        src={variants.original}
        alt={alt}
        className={className}
        loading={loadingAttr}
        decoding={decoding}
        {...props}
      />
    );
  }

  // Генерируем srcset для AVIF и WebP
  const avifSrcSet = generateSrcSet(variants, "avif", responsive);
  const webpSrcSet = generateSrcSet(variants, "webp", responsive);

  const sizesAttr = responsive ? (sizesProp ?? DEFAULT_SIZES) : undefined;

  const pictureClass = fill ? "absolute inset-0 block w-full h-full" : "block";
  const imgClass = [className, fill ? "w-full h-full object-cover" : ""].filter(Boolean).join(" ");

  return (
    <picture className={pictureClass}>
      {avifSrcSet && (
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizesAttr} />
      )}
      {webpSrcSet && (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizesAttr} />
      )}
      <img
        src={fallbackUrl}
        alt={alt}
        className={imgClass}
        loading={loadingAttr}
        decoding={decoding}
        sizes={sizesAttr}
        {...props}
      />
    </picture>
  );
}

/**
 * Хелпер для создания OptimizedImageVariants из данных БД
 */
export function createImageVariants(data: {
  image_url?: string | null;
  image_thumb_url?: string | null;
  image_medium_url?: string | null;
  image_large_url?: string | null;
  image_thumb_avif_url?: string | null;
  image_medium_avif_url?: string | null;
  image_large_avif_url?: string | null;
}): OptimizedImageVariants {
  return {
    original: data.image_url || "",
    thumb: data.image_thumb_url || null,
    medium: data.image_medium_url || null,
    large: data.image_large_url || null,
    thumbAvif: data.image_thumb_avif_url || null,
    mediumAvif: data.image_medium_avif_url || null,
    largeAvif: data.image_large_avif_url || null,
  };
}
