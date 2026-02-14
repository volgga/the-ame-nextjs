/**
 * variant_products + product_variants: загрузка из Supabase.
 * Один клиент — @/lib/supabaseClient.
 * Формат как Product (id, slug, title, price, image, shortDescription) для единого каталога.
 */

import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/lib/products";
import { getCategories } from "@/lib/categories";

const VP_ID_PREFIX = "vp-";
const LOG_PREFIX = "[variantProducts/Supabase]";

type VariantProductsRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  composition?: string | null;
  composition_flowers?: string[] | null;
  height_cm?: number | null;
  width_cm?: number | null;
  image_url: string | null;
  images?: string[] | null;
  min_price_cache: number | null;
  category_slug?: string | null;
  category_slugs?: string[] | null;
  is_active: boolean;
  is_hidden: boolean | null;
  published_at: string | null;
  sort_order: number;
  created_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  bouquet_colors?: string[] | null;
  is_new?: boolean | null;
  new_until?: string | null;
};

export type ProductVariantPublic = {
  id: number;
  name: string;
  price: number;
  composition?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image?: string | null;
  bouquetColors?: string[] | null;
  /** Флаг предзаказа для конкретного варианта */
  isPreorder?: boolean;
  /** Процент скидки 0–100 */
  discountPercent?: number | null;
  /** Цена со скидкой (финальная) */
  discountPrice?: number | null;
};

/**
 * Все видимые variant_products (is_active не false, is_hidden не true, published_at не фильтруем — показываем все).
 */
export async function getAllVariantProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("variant_products")
      .select(
        "id, slug, name, description, composition_flowers, image_url, images, min_price_cache, category_slug, category_slugs, is_active, is_hidden, published_at, sort_order, created_at, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, bouquet_colors, is_new, new_until"
      )
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[getAllVariantProducts] Supabase error:", error.message, "code:", error.code);
      return [];
    }
    if (!data?.length) return [];

    const vpIds = (data as VariantProductsRow[]).map((r) => r.id);
    const { data: variantsData } = await supabase
      .from("product_variants")
      .select("id, product_id, title, bouquet_colors, is_preorder, is_new, new_until, sort_order, price, discount_percent, discount_price")
      .in("product_id", vpIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });
    const colorsByProductId = new Map<number, string[]>();
    const firstVariantPreorderByProductId = new Map<number, boolean>();
    const variantIsNewByProductId = new Map<number, { isNew: boolean; newUntil: string | null }>();
    type VariantRow = {
      id: number;
      product_id: number;
      title?: string | null;
      bouquet_colors?: string[] | null;
      is_preorder?: boolean | null;
      is_new?: boolean | null;
      new_until?: string | null;
      price?: number | null;
      discount_percent?: number | null;
      discount_price?: number | null;
    };
    const variantsByProductId = new Map<number, import("@/lib/products").ProductVariantOption[]>();
    for (const v of variantsData ?? []) {
      const row = v as VariantRow;
      const pid = row.product_id;
      const list = variantsByProductId.get(pid) ?? [];
      list.push({
        id: row.id,
        name: row.title ?? "",
        price: Number(row.price ?? 0),
        discountPercent: row.discount_percent != null ? Number(row.discount_percent) : null,
        discountPrice: row.discount_price != null ? Number(row.discount_price) : null,
      });
      variantsByProductId.set(pid, list);
    }
    for (const v of variantsData ?? []) {
      const row = v as { product_id: number; bouquet_colors?: string[] | null; is_preorder?: boolean | null; is_new?: boolean | null; new_until?: string | null };
      const pid = row.product_id;
      const arr = row.bouquet_colors;

      // Фиксируем флаг предзаказа только для ПЕРВОГО активного варианта (по sort_order)
      if (!firstVariantPreorderByProductId.has(pid)) {
        firstVariantPreorderByProductId.set(pid, row.is_preorder ?? false);
      }

      // Для флага "новый" проверяем все варианты: если хотя бы один вариант имеет флаг "Новый" с валидной датой,
      // то бейдж показывается на карточке вариантного товара
      if (row.is_new === true) {
        const existing = variantIsNewByProductId.get(pid);
        const newUntil = row.new_until ?? null;
        // Если уже есть вариант с флагом "Новый", выбираем тот, у которого более поздняя дата new_until
        if (!existing || (newUntil && (!existing.newUntil || new Date(newUntil) > new Date(existing.newUntil)))) {
          variantIsNewByProductId.set(pid, {
            isNew: true,
            newUntil: newUntil,
          });
        }
      }

      if (!Array.isArray(arr)) continue;
      const keys = arr.filter((k): k is string => typeof k === "string" && k.length > 0);
      if (keys.length === 0) continue;
      const existing = colorsByProductId.get(pid) ?? [];
      colorsByProductId.set(pid, [...new Set([...existing, ...keys])]);
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
    return Promise.all(
      data.map(async (r) => {
        const row = r as VariantProductsRow;
        const categorySlugs: string[] = [];
        if (row.category_slugs && Array.isArray(row.category_slugs)) {
          categorySlugs.push(...row.category_slugs);
        }
        if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
          categorySlugs.push(row.category_slug);
        }

        const categories = categorySlugs.length > 0 ? getCategoryNames(categorySlugs) : undefined;

        const productColors = Array.isArray(row.bouquet_colors)
          ? row.bouquet_colors.filter((k): k is string => typeof k === "string" && k.length > 0)
          : [];
        const variantColors = colorsByProductId.get(row.id) ?? [];
        const mergedColors = [...new Set([...productColors, ...variantColors])];
        const firstVariantIsPreorder = firstVariantPreorderByProductId.get(row.id) ?? false;
        const variantIsNew = variantIsNewByProductId.get(row.id);

        // Для вариантных товаров флаг "новый" определяется по варианту, если хотя бы один вариант имеет флаг "Новый",
        // иначе по самому товару (variant_products.is_new)
        const effectiveIsNew = variantIsNew?.isNew ?? row.is_new ?? false;
        const effectiveNewUntil = variantIsNew?.newUntil ?? row.new_until ?? null;

        const imagesRaw = row.images;
        const images =
          Array.isArray(imagesRaw) && imagesRaw.length > 0
            ? imagesRaw.filter((u): u is string => typeof u === "string" && u.length > 0)
            : undefined;

        return {
          id: VP_ID_PREFIX + String(row.id),
          slug: row.slug ?? "",
          title: row.name ?? "",
          price: Number(row.min_price_cache) ?? 0,
          image: row.image_url ?? "",
          images,
          shortDescription: row.description ?? "",
          seoTitle: row.seo_title ?? null,
          seoDescription: row.seo_description ?? null,
          seoKeywords: row.seo_keywords ?? null,
          ogTitle: row.og_title ?? null,
          ogDescription: row.og_description ?? null,
          ogImage: row.og_image ?? null,
          composition: null,
          compositionFlowers:
            Array.isArray(row.composition_flowers) && row.composition_flowers.length > 0
              ? row.composition_flowers.filter((f): f is string => typeof f === "string" && f.length > 0)
              : null,
          sizeHeightCm: null,
          sizeWidthCm: null,
          categorySlug: row.category_slug ?? null,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
          categories: categories && categories.length > 0 ? categories : undefined,
          sortOrder: row.sort_order ?? 0,
          createdAt: row.created_at ?? undefined, // fallback для вторичной сортировки
          bouquetColors: mergedColors.length > 0 ? mergedColors : null,
          // Для вариантных товаров флаг предзаказа на витрине определяется только по ПЕРВОМУ активному варианту
          isPreorder: firstVariantIsPreorder,
          isNew: effectiveIsNew,
          newUntil: effectiveNewUntil,
          variants: variantsByProductId.get(row.id) ?? undefined,
        } satisfies Product;
      })
    );
  } catch (e) {
    console.error("[getAllVariantProducts]", e instanceof Error ? e.message : String(e));
    return [];
  }
}

/**
 * Один variant_product по slug.
 */
export async function getVariantProductBySlug(slug: string): Promise<Product | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const { data, error } = await supabase
      .from("variant_products")
      .select(
        "id, slug, name, description, image_url, images, min_price_cache, category_slug, category_slugs, is_active, is_hidden, published_at, sort_order, created_at, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, bouquet_colors, is_new, new_until"
      )
      .eq("slug", slug)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();

    if (error || !data) return null;

    // Загружаем категории для преобразования
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));
    const row = data as VariantProductsRow;
    const categorySlugs: string[] = [];
    if (row.category_slugs && Array.isArray(row.category_slugs)) {
      categorySlugs.push(...row.category_slugs);
    }
    if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
      categorySlugs.push(row.category_slug);
    }
    const categories =
      categorySlugs.length > 0
        ? categorySlugs.map((slug) => categoryMap.get(slug)).filter((name): name is string => Boolean(name))
        : undefined;

    const imagesRaw = row.images;
    const images =
      Array.isArray(imagesRaw) && imagesRaw.length > 0
        ? imagesRaw.filter((u): u is string => typeof u === "string" && u.length > 0)
        : undefined;

    return {
      id: VP_ID_PREFIX + String(row.id),
      slug: row.slug ?? "",
      title: row.name ?? "",
      price: Number(row.min_price_cache) ?? 0,
      image: row.image_url ?? "",
      images,
      shortDescription: row.description ?? "",
      seoTitle: row.seo_title ?? null,
      seoDescription: row.seo_description ?? null,
      seoKeywords: row.seo_keywords ?? null,
      ogTitle: row.og_title ?? null,
      ogDescription: row.og_description ?? null,
      ogImage: row.og_image ?? null,
      composition: null,
      sizeHeightCm: null,
      sizeWidthCm: null,
      categorySlug: row.category_slug ?? null,
      categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
      categories: categories && categories.length > 0 ? categories : undefined,
      bouquetColors:
        Array.isArray(row.bouquet_colors) && row.bouquet_colors.length > 0
          ? row.bouquet_colors.filter((k): k is string => typeof k === "string" && k.length > 0)
          : null,
      isNew: row.is_new ?? false,
      newUntil: row.new_until ?? null,
    };
  } catch (e) {
    console.error(`${LOG_PREFIX} getVariantProductBySlug:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Вариантный товар по slug с массивом вариантов (для витрины: состав/размер выбранного варианта).
 */
export async function getVariantProductWithVariantsBySlug(
  slug: string
): Promise<(Product & { variants?: ProductVariantPublic[] }) | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const { data: vp, error: vpErr } = await supabase
      .from("variant_products")
      .select(
        "id, slug, name, description, composition_flowers, image_url, images, min_price_cache, category_slug, category_slugs, is_active, is_hidden, published_at, sort_order, created_at, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, bouquet_colors, is_new, new_until"
      )
      .eq("slug", slug)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();

    if (vpErr || !vp) return null;

    // Загружаем категории для преобразования
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));
    const row = vp as VariantProductsRow;
    const categorySlugs: string[] = [];
    if (row.category_slugs && Array.isArray(row.category_slugs)) {
      categorySlugs.push(...row.category_slugs);
    }
    if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
      categorySlugs.push(row.category_slug);
    }
    const categories =
      categorySlugs.length > 0
        ? categorySlugs.map((slug) => categoryMap.get(slug)).filter((name): name is string => Boolean(name))
        : undefined;

    const imagesRaw = row.images;
    const images =
      Array.isArray(imagesRaw) && imagesRaw.length > 0
        ? imagesRaw.filter((u): u is string => typeof u === "string" && u.length > 0)
        : undefined;

    const product: Product = {
      id: VP_ID_PREFIX + String(row.id),
      slug: row.slug ?? "",
      title: row.name ?? "",
      price: Number(row.min_price_cache) ?? 0,
      image: row.image_url ?? "",
      images,
      shortDescription: row.description ?? "",
      seoTitle: row.seo_title ?? null,
      seoDescription: row.seo_description ?? null,
      seoKeywords: row.seo_keywords ?? null,
      ogTitle: row.og_title ?? null,
      ogDescription: row.og_description ?? null,
      ogImage: row.og_image ?? null,
      composition: null,
      compositionFlowers:
        Array.isArray(row.composition_flowers) && row.composition_flowers.length > 0
          ? row.composition_flowers.filter((f): f is string => typeof f === "string" && f.length > 0)
          : null,
      sizeHeightCm: null,
      sizeWidthCm: null,
      categorySlug: row.category_slug ?? null,
      categories: categories && categories.length > 0 ? categories : undefined,
      bouquetColors:
        Array.isArray(row.bouquet_colors) && row.bouquet_colors.length > 0
          ? row.bouquet_colors.filter((k): k is string => typeof k === "string" && k.length > 0)
          : null,
    };

    const { data: vars, error: vErr } = await supabase
      .from("product_variants")
      .select(
        "id, title, composition, height_cm, width_cm, price, image_url, seo_title, seo_description, og_image, bouquet_colors, is_preorder, is_new, new_until, discount_percent, discount_price"
      )
      .eq("product_id", (vp as { id: number }).id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (vErr || !vars?.length) return product;
    const variants: ProductVariantPublic[] = vars.map(
      (v: {
        id: number;
        title?: string;
        composition?: string | null;
        height_cm?: number | null;
        width_cm?: number | null;
        price?: number;
        image_url?: string | null;
        seo_title?: string | null;
        seo_description?: string | null;
        og_image?: string | null;
        bouquet_colors?: string[] | null;
        is_preorder?: boolean | null;
        is_new?: boolean | null;
        new_until?: string | null;
        discount_percent?: number | null;
        discount_price?: number | null;
      }) => ({
        id: v.id,
        name: v.title ?? "",
        price: Number(v.price ?? 0),
        composition: v.composition?.trim() || null,
        height_cm: v.height_cm != null ? Number(v.height_cm) : null,
        width_cm: v.width_cm != null ? Number(v.width_cm) : null,
        image_url: v.image_url ?? null,
        seo_title: v.seo_title ?? null,
        seo_description: v.seo_description ?? null,
        og_image: v.og_image ?? null,
        bouquetColors:
          Array.isArray(v.bouquet_colors) && v.bouquet_colors.length > 0
            ? v.bouquet_colors.filter((k): k is string => typeof k === "string" && k.length > 0)
            : null,
        isPreorder: v.is_preorder ?? false,
        discountPercent: v.discount_percent != null ? Number(v.discount_percent) : null,
        discountPrice: v.discount_price != null ? Number(v.discount_price) : null,
      })
    );
    return { ...product, variants };
  } catch (e) {
    console.error(`${LOG_PREFIX} getVariantProductWithVariantsBySlug:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** Является ли id из variant_products (vp-123). */
export function isVariantProductId(id: string): boolean {
  return id.startsWith(VP_ID_PREFIX);
}
