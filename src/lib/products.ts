/**
 * Товары: загрузка из Supabase (таблица products + variant_products для единого каталога).
 * Один источник данных — клиент из @/lib/supabaseClient.
 */

import { supabase } from "@/lib/supabaseClient";
import { getAllVariantProducts } from "@/lib/variantProducts";
import { slugify } from "@/utils/slugify";
import { getCategories } from "@/lib/categories";

/** Вариант товара (для вариантных товаров на витрине) */
export type ProductVariantOption = {
  id: number;
  name: string;
  price: number;
  composition?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  image_url?: string | null;
  /** Ключи цветов букета для фильтра */
  bouquetColors?: string[] | null;
  /** Флаг предзаказа для конкретного варианта */
  isPreorder?: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  shortDescription: string;
  /** SEO fields (если заполнены — используются в metadata) */
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  /** Состав букета (ручной ввод). У вариантного товара — из выбранного варианта. */
  composition?: string | null;
  /** Массив названий цветов для фильтрации (из composition_flowers или парсинг из composition) */
  compositionFlowers?: string[] | null;
  /** Высота букета, см */
  sizeHeightCm?: number | null;
  /** Ширина букета, см */
  sizeWidthCm?: number | null;
  /** Варианты (только у вариантного товара) */
  variants?: ProductVariantOption[];
  categorySlug?: string | null;
  /** Слоги категорий (для фильтрации по категории «Популярное» и др.) */
  categorySlugs?: string[] | null;
  /** Названия категорий товара (массив строк) */
  categories?: string[];
  isPreorder?: boolean;
  images?: string[];
  /** Порядок сортировки из админки (для объединённого каталога) */
  sortOrder?: number;
  /** Дата создания (для вторичной сортировки) */
  createdAt?: string;
  /** Флаг "новый" товар (ручной флаг из админки) */
  isNew?: boolean;
  /** Дата окончания статуса "новый" (null если не установлен) */
  newUntil?: string | null;
  /** Ключи цветов букета для фильтра «Цвет букета» */
  bouquetColors?: string[] | null;
};

/** Сырая строка таблицы products в Supabase */
type ProductsRow = {
  id: string;
  name: string;
  description?: string | null;
  composition_size?: string | null;
  composition_flowers?: string[] | null;
  height_cm?: number | null;
  width_cm?: number | null;
  image_url?: string | null;
  images?: string[] | null;
  price?: number | null;
  slug?: string | null;
  category_slug?: string | null;
  category_slugs?: string[] | null;
  is_active?: boolean | null;
  is_hidden?: boolean | null;
  is_preorder?: boolean | null;
  is_new?: boolean | null;
  new_until?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  bouquet_colors?: string[] | null;
};

/**
 * Преобразует слоги категорий в названия категорий
 */
async function slugsToCategoryNames(categorySlugs: string[] | null | undefined): Promise<string[]> {
  if (!categorySlugs || categorySlugs.length === 0) return [];

  try {
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));
    return categorySlugs.map((slug) => categoryMap.get(slug)).filter((name): name is string => Boolean(name));
  } catch {
    return [];
  }
}

async function rowToProduct(row: ProductsRow, getCategoryNames?: (slugs: string[]) => string[]): Promise<Product> {
  const slug = (row.slug && String(row.slug).trim()) || slugify(row.name) || String(row.id);
  const imagesRaw = row.images;
  const images =
    Array.isArray(imagesRaw) && imagesRaw.length > 0
      ? imagesRaw.filter((u): u is string => typeof u === "string" && u.length > 0)
      : undefined;

  // Получаем категории из category_slugs или category_slug
  let categories: string[] | undefined = undefined;
  const categorySlugs: string[] = [];
  if (row.category_slugs && Array.isArray(row.category_slugs)) {
    categorySlugs.push(...row.category_slugs);
  }
  if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
    categorySlugs.push(row.category_slug);
  }
  if (categorySlugs.length > 0) {
    if (getCategoryNames) {
      // Используем переданную функцию для получения названий (с кэшем)
      categories = getCategoryNames(categorySlugs);
    } else {
      // Загружаем напрямую (для единичных запросов)
      categories = await slugsToCategoryNames(categorySlugs);
    }
  }

  return {
    id: String(row.id),
    slug,
    title: row.name ?? "",
    price: Number(row.price) ?? 0,
    image: row.image_url ?? "",
    shortDescription: row.description ?? "",
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    seoKeywords: row.seo_keywords ?? null,
    ogTitle: row.og_title ?? null,
    ogDescription: row.og_description ?? null,
    ogImage: row.og_image ?? null,
    composition: row.composition_size?.trim() || null,
    compositionFlowers:
      Array.isArray(row.composition_flowers) && row.composition_flowers.length > 0
        ? row.composition_flowers.filter((f): f is string => typeof f === "string" && f.length > 0)
        : null,
    sizeHeightCm: row.height_cm != null ? Number(row.height_cm) : null,
    sizeWidthCm: row.width_cm != null ? Number(row.width_cm) : null,
    categorySlug: row.category_slug ?? null,
    categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
    categories: categories && categories.length > 0 ? categories : undefined,
    isPreorder: row.is_preorder ?? false,
    images,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? undefined, // fallback для вторичной сортировки
    isNew: row.is_new ?? false,
    newUntil: row.new_until ?? null,
    bouquetColors:
      Array.isArray(row.bouquet_colors) && row.bouquet_colors.length > 0
        ? row.bouquet_colors.filter((k): k is string => typeof k === "string" && k.length > 0)
        : null,
  };
}

const LOG_PREFIX = "[products/Supabase]";

/**
 * Получить все активные товары из Supabase (таблица products).
 * При ошибке или пустой таблице логируем и возвращаем [].
 */
export async function getAllProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(`${LOG_PREFIX} NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы.`);
    return [];
  }

  try {
    // Показываем все, где не скрыто явно: is_active не false, is_hidden не true
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, composition_size, composition_flowers, height_cm, width_cm, image_url, images, price, slug, category_slug, category_slugs, is_active, is_hidden, is_preorder, is_new, new_until, sort_order, created_at, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, bouquet_colors"
      )
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error(`[getAllProducts] Supabase error:`, error.message, "code:", error.code);
      if (error.code === "42P01") {
        console.error(`[getAllProducts] Таблица products не найдена.`);
      }
      if (error.code === "42501") {
        console.error(`[getAllProducts] Нет прав доступа (RLS).`);
      }
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`${LOG_PREFIX} Таблица products пуста или нет активных записей.`);
      return [];
    }

    // Загружаем все категории один раз для кэширования
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));

    // Создаем кэш для преобразования слогов в названия
    const categoryNamesCache = new Map<string, string[]>();
    const getCategoryNames = (slugs: string[]): string[] => {
      const cacheKey = slugs.sort().join(",");
      if (!categoryNamesCache.has(cacheKey)) {
        const names = slugs.map((slug) => categoryMap.get(slug)).filter((name): name is string => Boolean(name));
        categoryNamesCache.set(cacheKey, names);
      }
      return categoryNamesCache.get(cacheKey)!;
    };

    // Преобразуем все строки в Product с категориями
    return Promise.all(data.map((row) => rowToProduct(row as ProductsRow, getCategoryNames)));
  } catch (e) {
    console.error("[getAllProducts]", e instanceof Error ? e.message : String(e));
    return [];
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Найти товар по slug (или по id, если slug — валидный UUID).
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(`${LOG_PREFIX} NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы.`);
    return null;
  }

  try {
    const base = supabase
      .from("products")
      .select(
        "id, name, description, composition_size, composition_flowers, height_cm, width_cm, image_url, images, price, slug, category_slug, category_slugs, is_active, is_hidden, is_preorder, is_new, new_until, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, bouquet_colors"
      )
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null");

    const query = UUID_REGEX.test(slug) ? base.or(`slug.eq.${slug},id.eq.${slug}`) : base.eq("slug", slug);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error(`${LOG_PREFIX} Ошибка при загрузке товара по slug "${slug}":`, error.message, "код:", error.code);
      if (error.code === "42501") {
        console.error(`${LOG_PREFIX} Нет прав доступа (RLS).`);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    return rowToProduct(data as ProductsRow);
  } catch (e) {
    console.error(
      `${LOG_PREFIX} Supabase не отвечает при getProductBySlug:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

async function _getAllCatalogProductsUncached(): Promise<Product[]> {
  const [fromProducts, fromVariants] = await Promise.all([getAllProducts(), getAllVariantProducts()]);
  const combined = [...fromProducts, ...fromVariants];
  return combined.sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Единый каталог: products + variant_products.
 * Кэшируется 60 сек для быстрой навигации.
 */
export async function getAllCatalogProducts(): Promise<Product[]> {
  const { unstable_cache } = await import("next/cache");
  try {
    return await unstable_cache(_getAllCatalogProductsUncached, ["catalog-products"], {
      revalidate: 60,

      tags: ["catalog-products", "categories"],

    })();
  } catch (e) {
    console.error("[getAllCatalogProducts]", e instanceof Error ? e.message : String(e));
    return [];
  }
}

/**
 * Товар по slug: сначала products, затем variant_products.
 */
async function _getCatalogProductBySlugUncached(
  slug: string
): Promise<Product | (Product & { variants?: import("@/lib/variantProducts").ProductVariantPublic[] }) | null> {
  const fromProducts = await getProductBySlug(slug);
  if (fromProducts) return fromProducts;
  const { getVariantProductWithVariantsBySlug } = await import("@/lib/variantProducts");
  return getVariantProductWithVariantsBySlug(slug);
}

export async function getCatalogProductBySlug(
  slug: string
): Promise<Product | (Product & { variants?: import("@/lib/variantProducts").ProductVariantPublic[] }) | null> {
  const { unstable_cache } = await import("next/cache");
  return unstable_cache(() => _getCatalogProductBySlugUncached(slug), ["catalog-product", slug], {
    revalidate: 60,
    tags: ["catalog-products", "categories"],
  })();
}
