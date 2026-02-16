/**
 * Утилиты для генерации превью изображений (thumb, medium, large) в форматах WebP и AVIF
 * Использует sharp для обработки изображений на сервере
 */

import sharp from "sharp";

export type ImageSize = "thumb" | "medium" | "large";

export interface ImageVariants {
  thumb: {
    webp: Buffer | null;
    avif: Buffer | null;
  };
  medium: {
    webp: Buffer | null;
    avif: Buffer | null;
  };
  large: {
    webp: Buffer | null;
    avif: Buffer | null;
  };
}

export interface ImageSizeConfig {
  width: number;
  quality: {
    webp: number;
    avif: number;
  };
}

const SIZE_CONFIGS: Record<ImageSize, ImageSizeConfig> = {
  thumb: {
    width: 320,
    quality: {
      webp: 60,
      avif: 45,
    },
  },
  medium: {
    width: 768,
    quality: {
      webp: 70,
      avif: 50,
    },
  },
  large: {
    width: 1400,
    quality: {
      webp: 80,
      avif: 55,
    },
  },
};

/**
 * Загружает изображение по URL и возвращает Buffer
 */
async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Генерирует превью изображения в указанном размере и формате
 */
async function generateVariant(
  imageBuffer: Buffer,
  size: ImageSize,
  format: "webp" | "avif"
): Promise<Buffer | null> {
  const config = SIZE_CONFIGS[size];
  const quality = config.quality[format];

  try {
    let pipeline = sharp(imageBuffer).resize(config.width, null, {
      withoutEnlargement: true,
      fit: "inside",
    });

    if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "avif") {
      pipeline = pipeline.avif({ quality });
    }

    const result = await pipeline.toBuffer();
    return result;
  } catch (error) {
    console.error(`Error generating ${size} ${format}:`, error);
    return null;
  }
}

/**
 * Генерирует все варианты изображения (thumb, medium, large в WebP и AVIF)
 * @param imageUrl URL исходного изображения
 * @param options Опции генерации
 * @returns Объект с буферами всех вариантов
 */
export async function generateImageVariants(
  imageUrl: string,
  options: {
    /** Пропускать AVIF если он больше WebP на этот процент (по умолчанию 20%) */
    skipAvifIfLargerPercent?: number;
  } = {}
): Promise<ImageVariants> {
  const { skipAvifIfLargerPercent = 20 } = options;

  // Загружаем исходное изображение
  const originalBuffer = await fetchImageBuffer(imageUrl);

  const variants: ImageVariants = {
    thumb: { webp: null, avif: null },
    medium: { webp: null, avif: null },
    large: { webp: null, avif: null },
  };

  // Генерируем все варианты
  for (const size of ["thumb", "medium", "large"] as ImageSize[]) {
    // Сначала WebP (всегда генерируем)
    const webpBuffer = await generateVariant(originalBuffer, size, "webp");
    variants[size].webp = webpBuffer;

    if (webpBuffer) {
      // Затем AVIF
      const avifBuffer = await generateVariant(originalBuffer, size, "avif");

      if (avifBuffer) {
        // Проверяем размер: если AVIF больше WebP на X%, не используем его
        const webpSize = webpBuffer.length;
        const avifSize = avifBuffer.length;
        const sizeDiffPercent = ((avifSize - webpSize) / webpSize) * 100;

        if (sizeDiffPercent <= skipAvifIfLargerPercent) {
          variants[size].avif = avifBuffer;
        } else if (process.env.NODE_ENV !== "production") {
          console.log(
            `Skipping AVIF for ${size}: ${sizeDiffPercent.toFixed(1)}% larger than WebP`
          );
        }
      }
    }
  }

  return variants;
}

/**
 * Загружает сгенерированные варианты в Supabase Storage
 * @param variants Сгенерированные варианты
 * @param originalPath Путь к оригинальному файлу в Storage (например, "products/image.jpg")
 * @param storageBucket Имя bucket в Supabase Storage
 * @returns Объект с URL всех загруженных вариантов
 */
export async function uploadVariantsToStorage(
  variants: ImageVariants,
  originalPath: string,
  storageBucket: string,
  supabaseClient: any
): Promise<{
  thumb: { webp: string | null; avif: string | null };
  medium: { webp: string | null; avif: string | null };
  large: { webp: string | null; avif: string | null };
}> {
  // Извлекаем имя файла и расширение из оригинального пути
  const pathParts = originalPath.split("/").filter(Boolean);
  const fileName = pathParts[pathParts.length - 1] || "image";
  const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, "");
  const dir = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

  const uploadedUrls: {
    thumb: { webp: string | null; avif: string | null };
    medium: { webp: string | null; avif: string | null };
    large: { webp: string | null; avif: string | null };
  } = {
    thumb: { webp: null, avif: null },
    medium: { webp: null, avif: null },
    large: { webp: null, avif: null },
  };

  // Загружаем каждый вариант
  for (const size of ["thumb", "medium", "large"] as ImageSize[]) {
    const variant = variants[size];

    // WebP
    if (variant.webp) {
      const webpPath = dir
        ? `${dir}/${fileNameWithoutExt}_${size}.webp`
        : `${fileNameWithoutExt}_${size}.webp`;
      
      // Убираем начальный слеш если есть
      const cleanPath = webpPath.startsWith("/") ? webpPath.substring(1) : webpPath;
      
      const { data: webpData, error: webpError } = await supabaseClient.storage
        .from(storageBucket)
        .upload(cleanPath, variant.webp, {
          contentType: "image/webp",
          cacheControl: "public, max-age=3600, s-maxage=3600",
          upsert: true,
        });

      if (!webpError && webpData) {
        const { data: publicUrlData } = supabaseClient.storage
          .from(storageBucket)
          .getPublicUrl(cleanPath);
        uploadedUrls[size].webp = publicUrlData.publicUrl;
      } else if (webpError) {
        console.error(`Error uploading WebP ${size}:`, webpError);
      }
    }

    // AVIF
    if (variant.avif) {
      const avifPath = dir
        ? `${dir}/${fileNameWithoutExt}_${size}.avif`
        : `${fileNameWithoutExt}_${size}.avif`;
      
      // Убираем начальный слеш если есть
      const cleanPath = avifPath.startsWith("/") ? avifPath.substring(1) : avifPath;
      
      const { data: avifData, error: avifError } = await supabaseClient.storage
        .from(storageBucket)
        .upload(cleanPath, variant.avif, {
          contentType: "image/avif",
          cacheControl: "public, max-age=3600, s-maxage=3600",
          upsert: true,
        });

      if (!avifError && avifData) {
        const { data: publicUrlData } = supabaseClient.storage
          .from(storageBucket)
          .getPublicUrl(cleanPath);
        uploadedUrls[size].avif = publicUrlData.publicUrl;
      } else if (avifError) {
        console.error(`Error uploading AVIF ${size}:`, avifError);
      }
    }
  }

  return uploadedUrls;
}

/**
 * Извлекает путь к файлу из полного URL Supabase Storage
 * Пример: "https://xxx.supabase.co/storage/v1/object/public/products/image.jpg" -> "products/image.jpg"
 * Или: "https://xxx.supabase.co/storage/v1/object/public/products/image.jpg" -> "image.jpg" (если bucketName = "products")
 */
export function extractStoragePath(storageUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(storageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)$/);
    if (pathMatch) {
      const fullPath = pathMatch[1];
      // Если путь начинается с bucket name, убираем его
      if (fullPath.startsWith(`${bucketName}/`)) {
        return fullPath.substring(bucketName.length + 1);
      }
      // Если путь равен bucket name (корневой файл), возвращаем пустую строку или null
      if (fullPath === bucketName) {
        return null;
      }
      // Иначе возвращаем полный путь
      return fullPath;
    }
    return null;
  } catch {
    return null;
  }
}
