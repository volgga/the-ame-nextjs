import Image, { type ImageProps } from "next/image";
import { type ComponentPropsWithoutRef } from "react";

export type AppImageVariant = "card" | "hero" | "gallery" | "thumb" | "blog";

type AppImageProps = Omit<ImageProps, "quality"> & {
  /** Вариант использования изображения для автоматической настройки качества */
  variant?: AppImageVariant;
  /** Переопределение качества (если нужно явно указать) */
  quality?: number;
};

/**
 * Обертка над next/image с автоматической настройкой качества по варианту использования.
 * Использует AVIF/WebP форматы (настроено в next.config.ts) для оптимизации трафика.
 *
 * Варианты качества:
 * - card: 60-65 (карточки товаров в каталоге)
 * - thumb: 55-60 (миниатюры)
 * - blog: 65-70 (карточки блога)
 * - gallery: 75-80 (галерея товара, главное фото)
 * - hero: 75-80 (hero слайды, крупные баннеры)
 */
export function AppImage({ variant = "card", quality, ...props }: AppImageProps) {
  // Определяем качество по варианту, если не указано явно
  const getQuality = (): number => {
    if (quality !== undefined) return quality;

    switch (variant) {
      case "card":
        return 62; // Среднее между 60-65
      case "thumb":
        return 58; // Среднее между 55-60
      case "blog":
        return 68; // Среднее между 65-70
      case "gallery":
        return 78; // Среднее между 75-80
      case "hero":
        return 78; // Среднее между 75-80
      default:
        return 75; // Fallback
    }
  };

  return <Image {...props} quality={getQuality()} />;
}
